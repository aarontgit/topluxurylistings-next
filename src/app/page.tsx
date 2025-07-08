"use client";

import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { getRecommendedListings } from "../lib/firestore";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function HomePage() {
  const [recommended, setRecommended] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLocationAndListings = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const geo = await res.json();
        const city = geo.city;

        const results = await getRecommendedListings(city);
        const filtered = results.filter((l: any) => l.Beds);
        setRecommended(filtered);
      } catch (err) {
        console.error("Location fetch error:", err);
      }
    };

    fetchLocationAndListings();
  }, []);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -400, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 400, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col text-white">
      <NavBar />

      {/* Hero section with gradient */}
      <div className="bg-gradient-to-b from-[#0E0E0B] to-[#3A3A34]">
        <main className="pt-28 px-6 md:px-12 lg:px-24 text-center">
          <div className="max-w-4xl mx-auto py-12">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
              Get the Most for Your Home
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8">
              Top Luxury Listings connects discerning buyers with premium homes.
              Our valuation tool gives you a data-driven edge when preparing to sell.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link href="/valuation">
                <span className="inline-block px-8 py-4 bg-gold-500 text-black font-semibold rounded hover:bg-gold-400 transition">
                  Get a Valuation
                </span>
              </Link>
              <Link href="/contact">
                <span className="inline-block px-8 py-4 border border-gold-500 text-gold-500 font-semibold rounded hover:bg-gold-500 hover:text-black transition">
                  Contact Us
                </span>
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* Content below gradient */}
      <main className="flex-1 px-6 md:px-12 lg:px-24 text-black bg-white">
        <div className="max-w-6xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4 text-[#0E0E0B]">
              Why Choose Top Luxury Listings?
            </h2>
            <p className="text-gray-700 mb-4">
              Our experienced team and modern tools provide homeowners with accurate insights and unmatched exposure to high-net-worth buyers. We prioritize presentation, precision, and professionalism.
            </p>
            <ul className="list-disc list-inside text-gray-600">
              <li>Expert Valuation Tools</li>
              <li>High-End Market Visibility</li>
              <li>Dedicated Concierge Service</li>
            </ul>
          </div>
          <div className="flex justify-center">
            <Image
              src="/hero.png"
              alt="Luxury Home"
              width={500}
              height={400}
              className="rounded-lg shadow-lg object-cover"
            />
          </div>
        </div>

        {recommended.length > 0 && (
          <div className="max-w-6xl mx-auto mt-16">
            <h2 className="text-2xl font-bold mb-6 text-[#0E0E0B]">See What&apos;s Trending</h2>
            <div className="relative">
              <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow z-10"
              >
                <ChevronLeft className="text-black w-6 h-6" />
              </button>
              <div
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto scroll-smooth no-scrollbar px-8"
              >
                {recommended.map((listing) => (
                  <div
                    key={listing.id}
                    className="min-w-[280px] max-w-[280px] border rounded-xl p-4 shadow shrink-0"
                  >
                    <Image
                      src={listing.Image}
                      alt={listing.Address}
                      width={400}
                      height={300}
                      className="rounded mb-4 object-cover"
                    />
                    <h3 className="text-lg font-semibold">{listing.Address}</h3>
                    <p className="text-gray-700">{listing.Beds} beds • {listing.Baths} baths</p>
                    <p className="text-gray-900 font-bold">{listing.Price}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow z-10"
              >
                <ChevronRight className="text-black w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
