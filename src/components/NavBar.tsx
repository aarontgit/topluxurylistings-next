"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import { Menu, X, User as UserIcon } from "lucide-react";
import { app } from "../lib/firebase";
import AuthModal from "./AuthModal";

export default function NavBar() {
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (nav) {
      const height = nav.offsetHeight;
      document.documentElement.style.setProperty("--navbar-height", `${height}px`);
    }
  }, []);

  const handleSignOut = async () => {
    try {
      window.gtag?.("event", "user_signed_out", {
        event_category: "Auth",
        user_email: auth.currentUser?.email || "(unknown)",
      });
      await signOut(auth);
      setShowProfileMenu(false);
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  const links = ["valuation", "buy", "agents", "contact", "sell"];
  const leftLinks = ["buy", "sell", "valuation"];
  const rightLinks = ["agents", "contact"];

  return (
    <nav
      ref={navRef}
      className="bg-white text-gray-900 shadow-sm fixed top-0 w-full z-50 border-b border-gray-200"
    >
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
          <div className="relative w-14 h-14">
            <Image
              src="/logo.png"
              alt="Top Luxury Listings Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className="text-2xl font-bold text-gray-900 tracking-wide">Top Luxury Listings</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center justify-between w-full text-sm font-semibold">
          {/* Left links */}
          <div className="flex space-x-8">
            {leftLinks.map((link) => (
              <Link
                key={link}
                href={`/${link}`}
                className="uppercase tracking-wide text-gray-800 hover:text-gold-500 transition-colors"
              >
                {link.charAt(0).toUpperCase() + link.slice(1)}
              </Link>
            ))}
          </div>

          {/* Right links */}
          <div className="flex items-center space-x-6 relative">
            {rightLinks.map((link) => (
              <Link
                key={link}
                href={`/${link}`}
                className="uppercase tracking-wide text-gray-800 hover:text-gold-500 transition-colors"
              >
                {link.charAt(0).toUpperCase() + link.slice(1)}
              </Link>
            ))}

            <div className="relative">
              <button
                onClick={() => {
                  if (user) {
                    setShowProfileMenu((prev) => !prev);
                  } else {
                    setShowAuthModal(true);
                  }
                }}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <UserIcon className="w-5 h-5" />
              </button>
              {user && showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-md z-50">
                  <div className="px-4 py-2 text-xs text-gray-600 truncate">{user.email}</div>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hamburger for mobile */}
        <button
          className="md:hidden flex items-center"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-7 w-7 text-gray-900" />
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
                  className="uppercase font-semibold tracking-wide text-gray-900"
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
                    setShowAuthModal(true);
                    setMobileOpen(false);
                  }}
                  className="bg-gold-500 text-black px-3 py-2 rounded hover:bg-gold-400 text-sm transition"
                >
                  Sign In
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

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </nav>
  );
}
