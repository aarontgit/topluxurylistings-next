"use client";

import { useState, useEffect, useRef } from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { app, db } from "../lib/firebase";

export default function ValuationTool() {
  const [user, setUser] = useState<User | null>(null);
  const [address, setAddress] = useState("");
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

  useEffect(() => {
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

  const handleValuationUsage = async (userId: string) => {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const count = data.valuationCount || 0;

      if (data.tier !== "admin" && count >= 3) {
        throw new Error("You’ve reached your valuation limit.");
      }

      await updateDoc(userRef, { valuationCount: count + 1 });
    } else {
      await setDoc(userRef, {
        email: auth.currentUser?.email || "",
        tier: "free",
        valuationCount: 1,
      });
    }
  };

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

    try {
      if (!user) {
        await signInWithPopup(auth, new GoogleAuthProvider());
      }

      if (auth.currentUser) {
        await handleValuationUsage(auth.currentUser.uid);
        setError(null);
        fetchPropertyValuation(address);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication or usage error.");
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setValuation(null);
      setAddress("");
      setError(null);
    } catch (err) {
      console.error("Sign out error:", err);
      setError("Error signing out.");
    }
  };
  

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Home Valuation Tool</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          ref={addressInputRef}
          placeholder="Enter Property Address"
          className="w-full p-3 border border-gray-300 rounded"
          required
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Evaluating..." : "Get Valuation"}
        </button>
      </form>

      {valuation && (
        <div className="mt-6 bg-white p-4 rounded shadow space-y-3">
          <h3 className="text-xl font-semibold">Estimated Home Value</h3>
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
              className="rounded mt-4 w-full max-h-64 object-cover"
            />
          )}
        </div>
      )}

        {user && (
        <div className="text-sm text-gray-500 mt-4 flex justify-between items-center">
            <p>Signed in as {user.email}</p>
            <button
            onClick={handleSignOut}
            className="text-blue-600 underline ml-4 hover:text-blue-800 transition"
            >
            Sign Out
            </button>
        </div>
        )}

    </div>
  );
}
