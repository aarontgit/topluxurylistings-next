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
import ListingCard from "../components/ListingCard";

export default function HomePage() {
  const [recommended, setRecommended] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");

  // --- GA helper (inline) ---
  const track = (name: string, params?: Record<string, any>) => {
    (window as any)?.gtag?.("event", name, params || {});
  };

  // NEW: detect desktop to mirror Buy page behavior
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsDesktop("matches" in e ? e.matches : (e as MediaQueryList).matches);
    onChange(mq);
    mq.addEventListener?.("change", onChange as (e: MediaQueryListEvent) => void);
    return () => mq.removeEventListener?.("change", onChange as (e: MediaQueryListEvent) => void);
  }, []);

  // Page view
  useEffect(() => {
    track("homepage_view");
  }, []);

  useEffect(() => {
    const fetchLocationAndListings = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error("IP lookup failed");
        const geo = await res.json();
        const city = geo.city;

        track("homepage_geo_detect", { city: city || "(unknown)" });

        const results = await getRecommendedListings(city);
        const filtered = results.filter((l: any) => l.Beds);
        setRecommended(filtered);
        track("trending_loaded", { count: filtered.length, source: "geo", city: city || "(unknown)" });
      } catch (err) {
        track("homepage_geo_detect_error");
        const results = await getRecommendedListings("Denver");
        const filtered = results.filter((l: any) => l.Beds);
        setRecommended(filtered);
        track("trending_loaded", { count: filtered.length, source: "fallback", city: "Denver" });
      }
    };

    fetchLocationAndListings();
  }, []);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -400, behavior: "smooth" });
    track("trending_scroll", { direction: "left" });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 400, behavior: "smooth" });
    track("trending_scroll", { direction: "right" });
  };

  // Track overlay open
  useEffect(() => {
    if (expandedId) {
      track("listing_overlay_open", { source: "trending", listingId: expandedId });
    }
  }, [expandedId]);

  const selectedListing = recommended.find((l) => l.id === expandedId);

  return (
    <GoogleMapsLoader>
      <div className="min-h-screen flex flex-col relative">
        <NavBar />

        {/* Hero Banner with Image and Search */}
        <div
          className="hero-bg relative w-full bg-cover bg-bottom lg:bg-center h-[360px] sm:h-[440px] lg:h-[520px]"
        >
          <div className="absolute inset-0 bg-black/40 flex items-center px-6 md:px-12 lg:px-24">
            <div className="text-left max-w-2xl ml-0 sm:ml-12">
              {/* ONLY CHANGE: slightly larger mobile font, still one line */}
              <h1 className="text-white font-bold mb-6 drop-shadow-md whitespace-nowrap leading-tight text-[clamp(1.4rem,6.9vw,1.9rem)] sm:text-5xl">
                Your next move starts here.
              </h1>
              <SearchBar
                value={searchInput}
                onChange={setSearchInput}
                onSearch={(input, cityOverride, countyOverride, zipOverride) => {
                  track("search_initiated", {
                    input,
                    cityOverride: cityOverride || null,
                    countyOverride: countyOverride || null,
                    zipOverride: zipOverride || null,
                    source: "homepage_searchbar",
                  });
                  const params = new URLSearchParams();
                  params.set("input", input);
                  if (zipOverride) params.set("zip", zipOverride);
                  if (cityOverride) params.set("city", cityOverride);
                  if (countyOverride) params.set("county", countyOverride);
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

                <div ref={scrollRef} className="overflow-x-auto scroll-smooth no-scrollbar">
                  <div className="flex gap-6">
                    {recommended.map((listing) => (
                      <div
                        key={listing.id}
                        onMouseEnter={() => setHoveredId(listing.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => {
                          setExpandedId(listing.id);
                          track("listing_expand", { source: "trending", listingId: listing.id });
                        }}
                        className="min-w-[280px] max-w-[280px] bg-white border border-gray-200 rounded-xl p-4 shadow-md shrink-0 transition-transform duration-300 cursor-pointer hover:scale-[1.03]"
                      >
                        <Image
                          src={listing.Image}
                          alt={listing.Address || "Listing photo"}
                          width={400}
                          height={300}
                          className="rounded mb-4 object-cover w-full h-[180px]"
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

        {/* Expanded ListingCard Overlay */}
        {selectedListing && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 lg:items-center sm:items-start sm:pt-4"
            onClick={() => {
              track("listing_overlay_close", { source: "trending", via: "backdrop" });
              setExpandedId(null);
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl mx-auto sm:mx-2 sm:mt-4 relative"
            >
              <ListingCard
                listing={selectedListing}
                isExpanded={true}
                onClose={() => {
                  track("listing_overlay_close", { source: "trending", via: "button" });
                  setExpandedId(null);
                }}
                useMobileCarousel={!isDesktop}
              />
            </div>
          </div>
        )}

        <Footer />
      </div>

      {/* Scoped CSS: desktop uses existing image; mobile swaps to the blurred house image */}
      <style jsx>{`
        .hero-bg {
          background-image: url("/homepage-real-estate-banner.png");
        }
        @media (max-width: 1023px) {
          .hero-bg {
            background-image: url("/topluxurylistings-homepagebackground-mobile.png");
          }
        }
      `}</style>
    </GoogleMapsLoader>
  );
}
