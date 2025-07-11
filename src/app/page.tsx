"use client";

import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { getRecommendedListings } from "../lib/firestore";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SearchBar from "../components/SearchBar";
import { useRouter } from "next/navigation";
import GoogleMapsLoader from "components/GoogleMapsLoader";



export default function HomePage() {
  const [recommended, setRecommended] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");



  useEffect(() => {
    const fetchLocationAndListings = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error("IP lookup failed");
        const geo = await res.json();
        const city = geo.city;
  
        const results = await getRecommendedListings(city);
        const filtered = results.filter((l: any) => l.Beds);
        setRecommended(filtered);
      } catch (err) {
        //console.error("Location fetch error:", err);
        // Optional: Load default city
        const results = await getRecommendedListings("Denver");
        const filtered = results.filter((l: any) => l.Beds);
        setRecommended(filtered);
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
    <GoogleMapsLoader>
    <div className="min-h-screen flex flex-col text-white">
      <NavBar />

        {/* Hero Banner with Image and Search */}
        <div
          className="relative w-full bg-cover bg-center"
          style={{
            backgroundImage: 'url("/homepage-real-estate-banner.png")',
            height: "520px",
          }}
        >
          <div className="absolute inset-0 bg-black/40 flex items-center px-6 md:px-12 lg:px-24">
            <div className="text-left max-w-2xl ml-4 sm:ml-12">
              <h1 className="text-white text-4xl sm:text-5xl font-bold mb-6 drop-shadow-md">
                Your next move starts here.
              </h1>
              <SearchBar
                value={searchInput}
                onChange={setSearchInput}
                onSearch={(input, cityOverride, countyOverride, zipOverride) => {
                  const params = new URLSearchParams();
                  params.set("input", input); // <-- ✅ full string like "518 S Williams St..."
                    if (zipOverride) params.set("zip", zipOverride);
                    if (cityOverride) params.set("city", cityOverride);
                    if (countyOverride) params.set("county", countyOverride);
                    params.set("input", input);
                    router.push(`/buy?${params.toString()}`);
                }}
                inputClassName="w-[600px] max-w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-black text-base shadow"
              />


            </div>
          </div>
        </div>


      {/* Content below gradient */}
      <main className="flex-1 px-6 md:px-12 lg:px-24 text-black bg-white">
        {recommended.length > 0 && (
          <div className="max-w-6xl mx-auto mt-16">
            <h2 className="text-3xl font-bold mb-6 text-[#0E0E0B]">
              See What’s Trending
            </h2>

            <div className="relative">
              <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow z-10"
              >
                <ChevronLeft className="text-black w-6 h-6" />
              </button>

              {/* Scroll container */}
              <div ref={scrollRef} className="overflow-x-auto scroll-smooth no-scrollbar">
                {/* Inner wrapper for spacing */}
                <div className="flex gap-6">
                  {recommended.map((listing) => (
                    <div
                      key={listing.id}
                      className="min-w-[280px] max-w-[280px] bg-white border border-gray-200 rounded-xl p-4 shadow-md shrink-0"
                    >
                      <Image
                        src={listing.Image}
                        alt={listing.Address}
                        width={400}
                        height={300}
                        className="rounded mb-4 object-cover"
                      />
                      <h3 className="text-lg font-semibold text-[#0E0E0B] truncate">
                        {listing.Address}
                      </h3>
                      <p className="text-gray-700 text-sm">
                        {listing.Beds} beds • {listing.Baths} baths
                      </p>
                      <p className="text-gray-900 font-bold text-base mt-1">
                        {listing.Price}
                      </p>
                    </div>
                  ))}
                </div>
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
    </GoogleMapsLoader>
  );
}
