// src/components/NavBar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  User,
} from "firebase/auth";
import { app } from "../lib/firebase";

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Sign-in error:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  return (
    <nav
      className={`bg-[#0E0E0B] text-white shadow-sm fixed top-0 w-full z-50 border-b border-gold-500 transition-all duration-500 ${
        isHovered ? "bg-white text-black" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between transition-all duration-500">
        <Link href="/">
          <div className="flex items-center space-x-2">
            <div className="relative w-12 h-12">
              <Image
                src="/logo.png"
                alt="Top Luxury Listings Logo"
                fill
                className={`object-contain transition-opacity duration-900 ${
                  isHovered ? "opacity-0" : "opacity-100"
                }`}
              />
              <Image
                src="/inverted-logo.png"
                alt="Top Luxury Listings Logo Inverted"
                fill
                className={`object-contain absolute top-0 left-0 transition-opacity duration-500 ${
                  isHovered ? "opacity-100" : "opacity-0"
                }`}
              />
            </div>
          </div>
        </Link>

        <div className="flex items-center space-x-8 text-sm font-semibold">
          {["valuation", "listings", "agents", "contact"].map((link) => (
            <Link
              key={link}
              href={`/${link}`}
              className={`uppercase tracking-wide transition-colors duration-200 ${
                isHovered ? "text-black hover:text-gold-500" : "text-white hover:text-gold-400"
              }`}
            >
              {link.charAt(0).toUpperCase() + link.slice(1)}
            </Link>
          ))}

          {user ? (
            <div className="flex items-center space-x-3">
              <span className={`text-xs font-light ${isHovered ? "text-black" : "text-white"}`}>
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-gold-500 text-black px-3 py-1 rounded hover:bg-gold-400 text-xs transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              className="bg-gold-500 text-black px-3 py-1 rounded hover:bg-gold-400 text-xs transition"
            >
              Sign In with Google
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
