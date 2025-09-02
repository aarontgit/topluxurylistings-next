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
        <div className="hero-bg relative w-full bg-cover bg-bottom lg:bg-center h-[360px] sm:h-[440px] lg:h-[520px]">
          <div className="absolute inset-0 bg-black/40 flex items-center px-6 md:px-12 lg:px-24">
            <div className="text-left max-w-2xl ml-0 sm:ml-12">
              {/* PHONE ONLY */}
              <h1 className="md:hidden text-white font-extrabold mb-6 drop-shadow-md leading-tight whitespace-nowrap text-[clamp(1.6rem,7.2vw,2.4rem)]">
                Real Estate, Refined
              </h1>
              {/* TABLET + DESKTOP (iPad Mini shows this) */}
              <h1 className="hidden md:block text-white font-bold mb-6 drop-shadow-md whitespace-nowrap leading-tight text-5xl">
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
                {/* ⬇️ Hide arrows on phones; show on lg+ */}
                <button
                  onClick={scrollLeft}
                  className="hidden lg:block absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow z-10"
                >
                  <ChevronLeft className="text-black w-6 h-6" />
                </button>

                <div ref={scrollRef} className="overflow-x-auto scroll-smooth no-scrollbar">
                  <div className="trending-row flex gap-6">
                    {recommended.map((listing) => (
                      <div
                        key={listing.id}
                        onMouseEnter={() => setHoveredId(listing.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => {
                          setExpandedId(listing.id);
                          track("listing_expand", { source: "trending", listingId: listing.id });
                        }}
                        className="trending-card bg-white border border-gray-200 rounded-xl p-4 shadow-md shrink-0 transition-transform duration-300 cursor-pointer hover:scale-[1.03]"
                      >
                        <Image
                          src={listing.Image}
                          alt={listing.Address || "Listing photo"}
                          width={500}
                          height={375}
                          className="trending-img rounded mb-4 object-cover w-full"
                        />
                        <h3 className="trending-title font-semibold text-[#0E0E0B] truncate">
                          {listing.Address}
                        </h3>
                        <p className="trending-meta text-gray-700">
                          {listing.Beds} beds • {listing.Baths} baths
                        </p>
                        <p className="trending-price text-gray-900 font-bold mt-1">
                          {listing.Price}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={scrollRight}
                  className="hidden lg:block absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow z-10"
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

      {/* Scoped CSS: hero bg + Trending responsive scale */}
      <style jsx>{`
        .hero-bg {
          background-image: url("/homepage-real-estate-banner.png");
        }
        @media (max-width: 1023px) {
          .hero-bg {
            background-image: url("/topluxurylistings-homepagebackground-mobile.png");
          }
        }

        /* Trending base (phones) */
        .trending-card { min-width: 280px; max-width: 280px; }
        .trending-img { height: 180px; }
        .trending-title { font-size: 1.125rem; } /* 18px */
        .trending-meta { font-size: 0.875rem; }  /* 14px */
        .trending-price { font-size: 1rem; }     /* 16px */

        /* iPad mini & general md (≥768) */
        @media (min-width: 768px) {
          .trending-card { min-width: 300px; max-width: 300px; }
          .trending-img { height: 200px; }
        }

        /* iPad Air portrait (≥820) — bigger */
        @media (min-width: 820px) {
          .trending-row { gap: 3rem; } /* 48px */
          .trending-card { min-width: 440px; max-width: 440px; }
          .trending-img { height: 320px; }
          .trending-title { font-size: 1.7rem; }   /* ~27.2px */
          .trending-meta { font-size: 1.15rem; }   /* ~18.4px */
          .trending-price { font-size: 1.6rem; }   /* 25.6px */
        }

        /* iPad Pro 11" portrait (≥834) — a bit bigger */
        @media (min-width: 834px) {
          .trending-row { gap: 3.25rem; } /* 52px */
          .trending-card { min-width: 460px; max-width: 460px; }
          .trending-img { height: 335px; }
        }

        /* Surface Pro 7 width (≥912) — bigger as requested */
        @media (min-width: 912px) {
          .trending-card { min-width: 480px; max-width: 480px; }
          .trending-img { height: 360px; }
          .trending-title { font-size: 1.875rem; } /* 30px */
          .trending-price { font-size: 1.75rem; }  /* 28px */
        }

        /* Desktop (≥1024) — REVERT to original desktop sizes */
        @media (min-width: 1024px) {
          .trending-row { gap: 1.5rem; }           /* matches gap-6 (24px) */
          .trending-card { min-width: 280px; max-width: 280px; }
          .trending-img { height: 180px; }
          .trending-title { font-size: 1.125rem; } /* 18px */
          .trending-meta { font-size: 0.875rem; }  /* 14px */
          .trending-price { font-size: 1rem; }     /* 16px */
        }

        /* iPad Pro 12.9" portrait (viewport width = 1024px) — upscale to match/better iPad Air */
        @media (width: 1024px) and (orientation: portrait) {
          .trending-row { gap: 3rem; }
          .trending-card { min-width: 480px; max-width: 480px; }
          .trending-img { height: 360px; }
          .trending-title { font-size: 1.875rem; } /* 30px */
          .trending-meta { font-size: 1.15rem; }   /* ~18.4px */
          .trending-price { font-size: 1.75rem; }  /* 28px */
        }
      `}</style>
    </GoogleMapsLoader>
  );
}
