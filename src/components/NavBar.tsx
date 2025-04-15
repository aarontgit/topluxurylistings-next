// src/components/NavBar.tsx
"use client";

import Link from "next/link";
import Image from "next/image";

export default function NavBar() {

  return (
    <nav className="bg-[#0E0E0B] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="Top Luxury Listings Logo"
              width={120}
              height={120}
              priority
            />
          </div>
        </Link>
        <div className="space-x-6 text-sm font-medium">
        <Link
            href="/valuation"
            className="text-lg font-semibold text-gold-500 hover:text-gold-400 transition-colors duration-200"
            >
            Valuation Tool
            </Link>

            <Link
            href="/contact"
            className="text-lg font-semibold text-gold-500 hover:text-gold-400 transition-colors duration-200"
            >
            Contact
            </Link>

        </div>
      </div>
    </nav>
  );
}
