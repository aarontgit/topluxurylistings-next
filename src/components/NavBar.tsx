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
import { Menu, X } from "lucide-react";
import { app } from "../lib/firebase";

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const links = ["valuation", "listings", "agents", "contact"];

  return (
    <nav
      className={`bg-[#0E0E0B] text-white shadow-sm fixed top-0 w-full z-50 border-b border-gold-500 transition-all duration-500 ${
        isHovered ? "bg-white text-black" : ""
      }`}
      onMouseEnter={() => {
        if (window.innerWidth >= 768) setIsHovered(true);
      }}
      onMouseLeave={() => {
        if (window.innerWidth >= 768) setIsHovered(false);
      }}
      
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between transition-all duration-500">
        {/* Logo */}
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

        {/* Desktop nav */}
        <div className="hidden md:flex items-center space-x-8 text-sm font-semibold">
          {links.map((link) => (
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

        {/* Hamburger for mobile */}
        <button
          className="md:hidden flex items-center"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-7 w-7 text-white" />
        </button>
      </div>

      {/* Mobile drawer menu */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex">
          <div className="bg-white text-black w-72 h-full p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold">Menu</h2>
              <button onClick={() => setMobileOpen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {links.map((link) => (
                <Link
                  key={link}
                  href={`/${link}`}
                  onClick={() => setMobileOpen(false)}
                  className="uppercase font-semibold tracking-wide hover:text-gold-500"
                >
                  {link.charAt(0).toUpperCase() + link.slice(1)}
                </Link>
              ))}
              {user ? (
                <>
                  <span className="text-xs text-gray-500">{user.email}</span>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileOpen(false);
                    }}
                    className="bg-gold-500 text-black px-3 py-2 rounded hover:bg-gold-400 text-sm transition"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    handleSignIn();
                    setMobileOpen(false);
                  }}
                  className="bg-gold-500 text-black px-3 py-2 rounded hover:bg-gold-400 text-sm transition"
                >
                  Sign In with Google
                </button>
              )}
            </div>
          </div>
          <div
            className="flex-1"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
        </div>
      )}
    </nav>
  );
}
