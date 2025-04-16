"use client";

import { useState, useEffect, useRef } from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { app, db } from "../lib/firebase";

export default function ValuationTool() {
  const [user, setUser] = useState<User | null>(null);
  const [address, setAddress] = useState(""); // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [valuation, setValuation] = useState<any>(null); 
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            email: firebaseUser.email,
            tier: "free",
            valuationCount: 0,
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;  
    if (!google || !addressInputRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(addressInputRef.current, {
      types: ["address"],
      componentRestrictions: { country: "us" },
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        setAddress(place.formatted_address);
        setError(null);
      }
    });
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
    } catch (err) {
      console.warn("Street View error:", err);
      setImageUrl(null);
    }
  };

  const fetchPropertyValuation = async (addr: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/rentcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: addr }),
      });

      if (!response.ok) throw new Error("Something went wrong");

      const data = await response.json();
      setValuation(data);
      fetchStreetView(addr);
    } catch (err) {
      console.error("Error fetching valuation:", err);
      setValuation(null);
      setError("Something went wrong fetching the valuation.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!address) {
      setError("Please select a valid address from the dropdown.");
      return;
    }
  
    const currentUser = auth.currentUser;
  
    if (!currentUser) {
      // 🔹 Track guest click
      window.gtag?.('event', 'get_valuation_clicked_guest', {
        event_category: 'Engagement',
        event_label: address,
      });
  
      setError("You must be signed in to get a valuation.");
      try {
        const result = await signInWithPopup(auth, new GoogleAuthProvider());
        setUser(result.user); // Update state
  
        // ✅ Track sign-in success after guest valuation click
        window.gtag?.('event', 'get_valuation_signin_success', {
          event_category: 'Auth',
          user_email: result.user.email,
        });
  
        return handleSubmit(e); // Re-submit with now-signed-in user
      } catch (popupError) {
        console.error("❌ Popup sign-in failed:", popupError);
        setError("Popup sign-in failed. Try allowing popups or checking browser settings.");
        return;
      }
    } else {
      // ✅ Track signed-in user click
      window.gtag?.('event', 'get_valuation_clicked_signedin', {
        event_category: 'Engagement',
        event_label: address,
        user_email: currentUser.email,
      });
    }
  
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const incrementRes = await fetch("/api/incrementValuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
  
      const result = await incrementRes.json();
  
      if (!incrementRes.ok) {
        setError(result.error || "Something went wrong.");
        return;
      }
  
      setError(null);
      fetchPropertyValuation(address);
    } catch (err: any) {
      console.error("🔴 handleSubmit error:", err);
      setError(err.message || "Authentication or usage error.");
    }
  };
  
  

  return (
    <div className="relative min-h-screen text-white">
      {/* Background Image */}
      <div className="absolute inset-0 bg-[url('/blue-tinted-hero.png')] bg-cover bg-center brightness-75 z-0"></div>

      {/* Overlay Content */}
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
            />
            <button
              type="submit"
              className="bg-white text-blue-700 font-medium px-6 py-3 rounded-md hover:bg-gray-200 transition"
            >
              {loading ? "Evaluating..." : "Get Valuation"}
            </button>
          </form>

          {error && <p className="mt-4 text-red-300 text-sm">{error}</p>}
        </div>
      </div>

      {/* Valuation Result Section */}
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
            />
          )}
        </div>
      )}
    </div>
  );
}
