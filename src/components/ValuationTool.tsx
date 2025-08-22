"use client";

import { useState, useEffect, useRef } from "react";
import {
  getAuth,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { app } from "../lib/firebase";
import { ensureUserDocument } from "../lib/createUserDoc";
import AuthModal from "./AuthModal";

export default function ValuationTool() {
  const [user, setUser] = useState<User | null>(null);
  const [address, setAddress] = useState("");
  const [valuation, setValuation] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingValuation, setPendingValuation] = useState<string | null>(null);

  const addressInputRef = useRef<HTMLInputElement>(null);
  const auth = getAuth(app);

  // --- GA helper (no PII) ---
  const track = (name: string, params?: Record<string, any>) =>
    (window as any)?.gtag?.("event", name, params || {});
  const classifyPlace = (place: google.maps.places.PlaceResult) => {
    const components = place.address_components || [];
    const get = (type: string) => components.find(c => c.types.includes(type));
    const streetNumber = get("street_number");
    const route = get("route");
    const postalCode = get("postal_code")?.long_name || null;
    const city = get("locality")?.long_name || null;
    const county = get("administrative_area_level_2")?.long_name || null;
    const state = get("administrative_area_level_1")?.short_name || null;
    const is_full_address = !!(streetNumber && route);
    let classification: "full_address"|"zip"|"city"|"county"|"free_text" = "free_text";
    if (is_full_address) classification = "full_address";
    else if (postalCode) classification = "zip";
    else if (city) classification = "city";
    else if (county) classification = "county";
    return {
      classification,
      is_full_address,
      zip: postalCode,
      city,
      county: county ? (county.includes("County") ? county : `${county} County`) : null,
      state,
    };
  };

  // Page view
  useEffect(() => {
    track("valuation_view");
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await ensureUserDocument();
        if (pendingValuation) {
          track("valuation_pending_resume");
          handleSubmitWithAddress(pendingValuation);
          setPendingValuation(null);
        }
      }
    });
    return () => unsubscribe();
  }, [auth, pendingValuation]);

  // Initialize Google Places Autocomplete on the input
  useEffect(() => {
    if (!addressInputRef.current) return;

    const interval = setInterval(() => {
      const google = (window as any).google;
      if (google?.maps?.places && addressInputRef.current) {
        const autocomplete = new google.maps.places.Autocomplete(addressInputRef.current, {
          types: ["address"],
          componentRestrictions: { country: "us" },
        });
        track("valuation_autocomplete_ready");

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place) {
            const meta = classifyPlace(place);
            track("valuation_place_select", meta);
          }
          if (place?.formatted_address) {
            setAddress(place.formatted_address);
            setError(null);
          }
        });

        clearInterval(interval); // Stop checking once it's initialized
      }
    }, 100);

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const fetchStreetView = async (addr: string) => {
    try {
      const res = await fetch("/api/streetview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr }),
      });

      if (!res.ok) throw new Error("Image not available");
      const data = await res.json();
      setImageUrl(data.imageUrl);
      track("valuation_streetview_success");
    } catch (err) {
      console.warn("Street View error:", err);
      setImageUrl(null);
      track("valuation_streetview_error");
    }
  };

  const fetchPropertyValuation = async (addr: string) => {
    setLoading(true);
    const t0 = performance.now?.() ?? Date.now();
    track("valuation_request", { addr_len: addr.length, provider: "rentcast" });
    try {
      const response = await fetch("/api/rentcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr }),
      });

      if (!response.ok) throw new Error("rentcast_http_error");

      const data = await response.json();
      setValuation(data);
      const t1 = performance.now?.() ?? Date.now();
      track("valuation_success", {
        provider: "rentcast",
        ms: Math.round(t1 - t0),
        has_price: data?.price != null,
        has_range: data?.priceRangeLow != null && data?.priceRangeHigh != null,
      });
      fetchStreetView(addr);
    } catch (err: any) {
      console.error("Error fetching valuation:", err);
      setValuation(null);
      setError("Something went wrong fetching the valuation.");
      const t1 = performance.now?.() ?? Date.now();
      track("valuation_error", {
        provider: "rentcast",
        ms: Math.round(t1 - t0),
        code: err?.message || "unknown",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setError("Please select a valid address from the dropdown.");
      track("valuation_submit_blocked", { reason: "missing_address" });
      return;
    }
    track("valuation_submit_click", { addr_len: address.length });
    handleSubmitWithAddress(address);
  };

  const handleSubmitWithAddress = async (addr: string) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setPendingValuation(addr);
      setShowAuthModal(true);
      track("valuation_auth_required");
      track("auth_modal_open", { source: "valuation_tool" });
      return;
    }

    try {
      const idToken = await currentUser.getIdToken();
      const incrementRes = await fetch("/api/incrementValuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const result = await incrementRes.json();

      if (!incrementRes.ok) {
        setError(result.error || "Something went wrong.");
        track("valuation_quota_error", { code: result.error || "unknown" });
        return;
      }

      setError(null);
      fetchPropertyValuation(addr);
    } catch (err: any) {
      console.error("🔴 handleSubmit error:", err);
      setError(err.message || "Authentication or usage error.");
      track("valuation_submit_error", { code: err?.message || "unknown" });
    }
  };

  // Result panel visibility
  const resultShownOnce = useRef(false);
  useEffect(() => {
    if (valuation && !resultShownOnce.current) {
      resultShownOnce.current = true;
      track("valuation_result_view", {
        has_price: valuation?.price != null,
        has_range: valuation?.priceRangeLow != null && valuation?.priceRangeHigh != null,
        has_image: !!imageUrl,
      });
    }
  }, [valuation, imageUrl]);

  return (
    <div className="relative min-h-screen text-white">
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      <div className="absolute inset-0 bg-[url('/blue-tinted-hero.png')] bg-cover bg-center brightness-75 z-0"></div>

      <div
        className={`relative z-10 px-6 flex flex-col items-center ${
          !valuation ? "min-h-screen justify-center" : "pt-20"
        }`}
      >
        <div className="w-full max-w-2xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-semibold mb-4">Estimate your home’s value</h1>
          <p className="mb-6 text-lg text-gray-100">
            Enter your address to get a free estimated market value of your property.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <input
              type="text"
              ref={addressInputRef}
              placeholder="Enter address"
              className="w-full sm:w-[400px] px-4 py-3 rounded-md text-gray-900 border border-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              onFocus={() => track("valuation_input_focus")}
              onBlur={() => track("valuation_input_blur", { len: address.length })}
              onChange={(e) => {
                setAddress(e.target.value);
                track("valuation_input_change", { len: e.target.value.length });
              }}
            />
            <button
              type="submit"
              className="bg-white text-blue-700 font-medium px-6 py-3 rounded-md hover:bg-gray-200 transition"
            >
              {loading ? "Evaluating..." : "Get Valuation"}
            </button>
          </form>

          {error && (
            <p className="mt-4 text-red-300 text-sm">
              {error}
            </p>
          )}
        </div>
      </div>

      {valuation && (
        <div className="bg-white text-gray-800 py-8 px-6 mt-12 z-20 relative shadow-xl rounded-xl w-full max-w-xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Your Estimated Home Value</h2>
          <p>
            <strong>Estimate:</strong>{" "}
            {valuation.price != null
              ? `$${valuation.price.toLocaleString()}`
              : "N/A"}
          </p>
          <p>
            <strong>Range:</strong>{" "}
            {valuation.priceRangeLow != null && valuation.priceRangeHigh != null
              ? `$${valuation.priceRangeLow.toLocaleString()} - $${valuation.priceRangeHigh.toLocaleString()}`
              : "N/A"}
          </p>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Property view"
              className="mt-4 rounded-md w-full max-h-64 object-cover"
              onLoad={() => track("valuation_result_image_shown")}
              onError={() => track("valuation_result_image_error")}
            />
          )}
        </div>
      )}
    </div>
  );
}
