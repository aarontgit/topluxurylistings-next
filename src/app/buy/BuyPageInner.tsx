"use client";

import MapView from "components/MapView";
import FiltersBar from "./FiltersBar";
import ListingsGrid from "./ListingsGrid";
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
import BedBathDropdown from "components/BedBathDropdown";
import PriceDropdown from "components/PriceDropdown";
import CountyCityMultiSelect from "components/CountyCityMultiSelect";
import ListingCard from "components/ListingCard";
import AuthModal from "../../components/AuthModal";
import SearchBar from "../../components/SearchBar";
import { getPublicListings } from "../../lib/firestore";
import { useEffect, useState } from "react";
import numeral from "numeral";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
import { app } from "../../lib/firebase";
import { ensureUserDocument } from "../../lib/createUserDoc";
import type { User } from "firebase/auth";
import type { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

type Listing = {
  id: string;
  Address?: string;
  City?: string;
  County?: string;
  PriceNum?: number;
  BedsNum?: number;
  BathsNum?: number;
  SqFtNum?: number;
  GeoPoint?: { latitude: number; longitude: number };
  distance?: number;
  [key: string]: any;
};

const formatCurrency = (val: string | number) => {
  const raw = typeof val === "string" ? val.replace(/[^\d]/g, "") : val.toString();
  if (!raw) return "";
  const num = Number(raw);
  if (isNaN(num)) return "";
  return numeral(num).format("$0,0");
};

export default function ListingsPage(){
  return (
    <>
      <Suspense fallback={null}>
        <ListingsPageInner />
      </Suspense>
    </>
  );
}

function ListingsPageInner() {
  // --- GA helper (minimal; no PII) ---
  const track = (name: string, params?: Record<string, any>) =>
    (window as any)?.gtag?.("event", name, params || {});

  const [isClient, setIsClient] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [cursorDoc, setCursorDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortOrder, setSortOrder] = useState<string>("");
  const [filters, setFilters] = useState({
    minPrice: '500000',
    maxPrice: '750000',
    beds: '',
    baths: '',
    exactBeds: false,
    cities: [] as string[],
    county: null as string | null,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingInquireListing, setPendingInquireListing] = useState<any | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [citySearch, setCitySearch] = useState(false);
  const [isZip, setIsZip] = useState(false);
  const [zipFallbackNotice, setZipFallbackNotice] = useState<string | null>(null);
  const [justSearchedFromAutocomplete, setJustSearchedFromAutocomplete] = useState(false);
  const [searchLocationLabel, setSearchLocationLabel] = useState<string | null>(null); // existing

  // ✅ NEW: track the active location coming from URL or autocomplete so all searches stay scoped
  const [activeLocation, setActiveLocation] = useState<{ zip?: string; city?: string; county?: string } | null>(null);

  // runtime media query
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsDesktop(("matches" in e ? e.matches : (e as MediaQueryList).matches));
    onChange(mq);
    mq.addEventListener?.("change", onChange as (e: MediaQueryListEvent) => void);
    return () => mq.removeEventListener?.("change", onChange as (e: MediaQueryListEvent) => void);
  }, []);

  // Mobile filters toggle
  const [showFilters, setShowFilters] = useState(false);

  const searchParams = useSearchParams();
  const inputFromParams = searchParams.get("input");

  // Apply URL params only once (including input)
  const [paramsApplied, setParamsApplied] = useState(false);

  // Gate input-from-URL by paramsApplied so the user can edit/delete afterward
  useEffect(() => {
    if (paramsApplied) return;
    if (inputFromParams != null) {
      setSearchInput(inputFromParams);
    }
  }, [paramsApplied, inputFromParams]);

  useEffect(() => {
    if (paramsApplied) return;

    const zip = searchParams.get("zip") ?? "";
    const city = searchParams.get("city") ?? "";
    const county = searchParams.get("county") ?? "";

    if (zip) {
      setFilters((prev) => ({ ...prev, cities: [], county: null }));
      setIsZip(true);
      setSearchLocationLabel(`ZIP Code ${zip}`);
      setActiveLocation({ zip }); // ✅ scope by zip
    } else if (city) {
      setFilters((prev) => ({ ...prev, cities: [city], county: null }));
      setIsZip(false);
      setSearchLocationLabel(city);
      setActiveLocation({ city }); // ✅ scope by city
    } else if (county) {
      const fullCounty = county.includes("County") ? county : `${county} County`;
      setFilters((prev) => ({ ...prev, cities: [], county: fullCounty }));
      setIsZip(false);
      setSearchLocationLabel(fullCounty);
      setActiveLocation({ county: fullCounty }); // ✅ scope by county
    }

    setParamsApplied(true);
  }, [searchParams, paramsApplied]);

  // Trigger initial search using state (after params applied)
  useEffect(() => {
    if (!paramsApplied) return;
    if (!searchInput.trim() || justSearchedFromAutocomplete) return;

    const trimmed = searchInput.trim();
    const isZipMatch = /^\d{5}$/.test(trimmed);

    // Prefer activeLocation overrides if present
    const cityOverride = activeLocation?.city;
    const countyOverride = activeLocation?.county;
    const zipOverride = activeLocation?.zip ?? (isZipMatch && !cityOverride && !countyOverride ? trimmed : undefined);

    const shouldSearch =
      !!cityOverride || !!countyOverride || !!zipOverride;

    if (!shouldSearch) return;

    handleSearchWithFilters(
      trimmed,
      cityOverride,
      countyOverride,
      zipOverride,
      null,
      // label should reflect what user typed/selected (address string if present)
      trimmed
    );
    setJustSearchedFromAutocomplete(false);
  }, [paramsApplied]); // run exactly once after params apply

  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  useEffect(() => {
    setIsClient(true);
    loadListings(true);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) await ensureUserDocument();
    });
    return () => unsubscribe();
  }, []);

  // Subsequent searches rely purely on component state + activeLocation to keep scope
  useEffect(() => {
    if (justSearchedFromAutocomplete) {
      setJustSearchedFromAutocomplete(false);
      return;
    }

    const { minPrice, maxPrice, beds, baths } = filters;
    const trimmedInput = searchInput.trim();
    const isZipMatch = /^\d{5}$/.test(trimmedInput);

    // Location overrides always taken from activeLocation first; fall back to filters if user chose city/county pickers
    const cityOverride = activeLocation?.city ?? (filters.cities.length > 0 ? filters.cities[0] : undefined);
    const countyOverride = activeLocation?.county ?? (filters.county ?? undefined);
    const zipOverride =
      activeLocation?.zip ??
      (isZipMatch && !cityOverride && !countyOverride ? trimmedInput : undefined);

    const shouldSearch =
      !!cityOverride || !!countyOverride || !!zipOverride || !!minPrice || !!maxPrice || !!beds || !!baths;

    if (!shouldSearch) return;

    handleSearchWithFilters(
      trimmedInput,
      cityOverride,
      countyOverride,
      zipOverride
    );
  }, [filters, searchInput, activeLocation]);

  // Keep sort scoped to the active location as well
  useEffect(() => {
    const trimmed = searchInput.trim();
    const cityOverride = activeLocation?.city ?? (filters.cities.length > 0 ? filters.cities[0] : undefined);
    const countyOverride = activeLocation?.county ?? (filters.county ?? undefined);
    const zipOverride = activeLocation?.zip;
    handleSearchWithFilters(trimmed, cityOverride, countyOverride, zipOverride);
  }, [sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent background scroll when mobile filters modal is open
  useEffect(() => {
    if (!showFilters) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [showFilters]);

  const handleInquire = async (listing: Listing) => {
    if (!auth.currentUser) {
      setPendingInquireListing(listing);
      setAuthModalOpen(true);
      return;
    }

    try {
      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch('/api/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, address: listing.Address }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to inquire');

      alert(`Thanks for your interest in ${listing.Address}! We'll be in touch soon.`);
    } catch (err: any) {
      console.error('❌ Inquiry error:', err.message);
      alert("There was a problem submitting your inquiry.");
    }
  };

  const handleAuthSuccess = async () => {
    setAuthModalOpen(false);
    if (pendingInquireListing) {
      await handleInquire(pendingInquireListing);
      setPendingInquireListing(null);
    }
  };

  // Add optional labelOverride to keep full address label when provided
  const handleSearchWithFilters = async (
    input: string,
    cityOverride?: string,
    countyOverride?: string,
    zipOverride?: string,
    cursorParam: QueryDocumentSnapshot<DocumentData> | null = null,
    labelOverride?: string,
  ) => {
    // Don't auto-force ZIP if the user has selected a city/county (or overrides are provided)
    const hasLocationContext =
      !!cityOverride || !!countyOverride || filters.cities.length > 0 || !!filters.county || !!activeLocation;

    if (/^\d{5}$/.test(input) && !zipOverride && !hasLocationContext) {
      setIsZip(true);
      setFilters((prev) => ({ ...prev, cities: [], county: null }));
      zipOverride = input; // promote instead of recursive re-entry
    }
  
    // Prefer explicit labelOverride (e.g., full address) over ZIP label
    setSearchLocationLabel(
      labelOverride ??
      (zipOverride
        ? `ZIP Code ${zipOverride}`
        : cityOverride
          ? cityOverride
          : countyOverride ?? input)
    );
  
    const shouldSearch =
      cityOverride || countyOverride || zipOverride ||
      filters.minPrice || filters.maxPrice || filters.beds || filters.baths;
  
    if (!shouldSearch) return;
  
    setCitySearch(false);
    setLoading(true);
  
    try {
      let field: string | undefined;
      let direction: 'asc' | 'desc' | undefined;
  
      if (sortOrder) {
        const [f, d] = sortOrder.split('_');
        field = f;
        direction = d as 'asc' | 'desc';
      } else {
        field = "RandomRank"; // default randomized order
        direction = "asc";
      }
  
      const { listings: newListings, nextPageCursor, zipFallback } = await getPublicListings({
        pageSize: isDesktop ? 40 : 20, // fewer on mobile
        cursor: cursorParam,
        orderField: field,
        orderDirection: direction,
        minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
        beds: filters.beds ? parseInt(filters.beds) : undefined,
        exactBeds: filters.exactBeds,
        baths: filters.baths ? parseInt(filters.baths) : undefined,
  
        // cities override county when present; zip wins over both
        cities: zipOverride
          ? undefined
          : cityOverride
            ? [cityOverride]
            : (filters.cities.length > 0 ? filters.cities : undefined),
  
        county: zipOverride
          ? undefined
          : (cityOverride || filters.cities.length > 0)
            ? undefined
            : (countyOverride ?? undefined),
  
        zip: zipOverride ?? undefined,
        citySearch: input,
      });
  
      if (zipFallback) {
        setZipFallbackNotice(
          `No listings found in ${zipFallback.originalZip}. Showing results near ${zipFallback.fallbackZip} (${zipFallback.fallbackCity}, ${zipFallback.fallbackCounty}).`
        );
      } else {
        setZipFallbackNotice(null);
      }
  
      setListings(cursorParam ? (prev) => [...prev, ...newListings] : newListings);
      setCursorDoc(nextPageCursor ?? null);
      setHasMore(!!nextPageCursor);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };
  

  const handleSearchFromAutocomplete = (
    input: string,
    city?: string,
    county?: string,
    zip?: string
  ) => {
    setSearchInput(input);

    if (zip) {
      // Keep label as the full address the user selected, but query by ZIP
      setFilters((prev) => ({ ...prev, cities: [], county: null }));
      setActiveLocation({ zip }); // ✅ remember the ZIP so later effects stay scoped
      handleSearchWithFilters(input, undefined, undefined, zip, null, input); // pass labelOverride
    } else if (county === "Denver County") {
      setFilters((prev) => ({ ...prev, cities: [], county: "Denver County" }));
      setActiveLocation({ county: "Denver County" });
      handleSearchWithFilters(input, undefined, "Denver County", undefined, null);
    } else {
      setFilters((prev) => ({
        ...prev,
        cities: city ? [city] : [],
        county: county ?? null,
      }));
      setActiveLocation({ city: city || undefined, county: county || undefined });
      handleSearchWithFilters(input, city, county, undefined, null);
    }

    setJustSearchedFromAutocomplete(true);
  };

  const loadListings = async (reset = false) => {
    setLoading(true);
    setCitySearch(false);
  
    let field: string | undefined;
    let direction: 'asc' | 'desc' | undefined;
  
    if (sortOrder) {
      const [f, d] = sortOrder.split('_');
      field = f;
      direction = d as 'asc' | 'desc';
    } else {
      field = "RandomRank"; // default randomized order
      direction = "asc";
    }
  
    const { listings: newListings, nextPageCursor } = await getPublicListings({
      pageSize: isDesktop ? 40 : 20, // fewer on mobile
      cursor: reset ? null : cursorDoc,
      orderField: field,
      orderDirection: direction,
      minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
      beds: filters.beds ? parseInt(filters.beds) : undefined,
      exactBeds: filters.exactBeds,
      baths: filters.baths ? parseInt(filters.baths) : undefined,
      cities: filters.cities.length > 0 ? filters.cities : undefined,
      county: filters.county ?? undefined,
    });
  
    setListings(prev => reset ? newListings : [...prev, ...newListings]);
    setCursorDoc(nextPageCursor ?? null);
    setHasMore(!!nextPageCursor);
    setLoading(false);
  };
  

  const handleLoadMore = () => {
    // MAIN INTERACTION: load more
    track("listings_load_more_click", { hasCursor: !!cursorDoc });
    const trimmed = searchInput.trim();
    const cityOverride = activeLocation?.city ?? (filters.cities.length > 0 ? filters.cities[0] : undefined);
    const countyOverride = activeLocation?.county ?? (filters.county ?? undefined);
    const zipOverride = activeLocation?.zip;
    handleSearchWithFilters(trimmed, cityOverride, countyOverride, zipOverride, cursorDoc);
  };

  const setCities = (value: string[] | ((prev: string[]) => string[])) => {
    setFilters(prev => {
      const nextCities = typeof value === 'function' ? value(prev.cities) : value;
      // ✅ keep activeLocation in sync when user chooses city via filters
      setActiveLocation(al => ({ ...(al || {}), city: nextCities[0], zip: undefined, county: undefined }));
      return { ...prev, cities: nextCities };
    });
  };

  const setCounty = (
    value: string | ((prev: string | null) => string | null) | null
  ) => {
    setFilters(prev => {
      const nextCounty = typeof value === 'function' ? value(prev.county) : value;
      // ✅ keep activeLocation in sync when user chooses county via filters
      setActiveLocation(al => ({ ...(al || {}), county: nextCounty || undefined, city: undefined, zip: undefined }));
      return { ...prev, county: nextCounty, cities: [] };
    });
  };

  const closeExpanded = () => setExpandedId(null);
  const expandedListing = listings.find(l => l.id === expandedId);

  if (!isClient) return null;

  return (
    <>
      <NavBar />
      <div className="min-h-screen px-6 pb-6 pt-20 bg-gray-50 text-black relative">

        {/* Mobile-only sticky SearchBar (centered & full width) */}
        <div className="lg:hidden sticky top-[70px] z-20 bg-gray-50 py-3">
          <div className="w-full px-0">
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSearch={handleSearchFromAutocomplete}
              // Make the input fill its container on mobile
              inputClassName="w-full px-3 py-2 rounded-md bg-white text-black text-sm border border-gray-300"
            />
          </div>
        </div>

        {/* Mobile Filters toggle */}
        <div className="lg:hidden mb-3">
          <button
            onClick={() => {
              const next = !showFilters;
              setShowFilters(next);
              track("filters_toggle", { open: next });
            }}
            aria-expanded={showFilters}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {/* Desktop filters: sticky & always visible */}
        <div className="hidden lg:block sticky top-[85px] z-40 bg-gray-50 py-3">
          <FiltersBar
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            handleSearchFromAutocomplete={handleSearchFromAutocomplete}
            filters={filters}
            setFilters={setFilters}
            setCities={setCities}
            setCounty={setCounty}
          />
        </div>

        {/* Mobile filters as a TOP modal */}
        {showFilters && (
          <div className="lg:hidden fixed inset-0 z-[100]">
            {/* overlay */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => {
                setShowFilters(false);
                track("filters_sheet_close", { via: "backdrop" });
              }}
              aria-hidden="true"
            />
            {/* sheet */}
            <div className="absolute top-0 left-0 right-0 max-h-[90vh] bg-white rounded-b-2xl shadow-2xl p-4 overflow-visible">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Filters</h3>
                <button
                  onClick={() => {
                    setShowFilters(false);
                    track("filters_sheet_close", { via: "button" });
                  }}
                  className="text-sm px-3 py-1 border rounded"
                  aria-label="Close filters"
                >
                  Close
                </button>
              </div>

              <FiltersBar
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                handleSearchFromAutocomplete={handleSearchFromAutocomplete}
                filters={filters}
                setFilters={setFilters}
                setCities={setCities}
                setCounty={setCounty}
              />

              <button
                onClick={() => {
                  setShowFilters(false);
                  track("filters_apply_click");
                }}
                className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {searchLocationLabel && (
          <div className="mb-4 p-3 rounded bg-blue-50 text-blue-900 border-l-4 border-blue-500">
            Showing listings near <strong>{searchLocationLabel}</strong>
          </div>
        )}

        {zipFallbackNotice && (
          <div className="mb-6 p-4 border-l-4 border-yellow-500 bg-yellow-50 text-yellow-800 rounded">
            {zipFallbackNotice}
          </div>
        )}

        <div className="w-full max-w-xs flex flex-col">
          <label className="text-sm font-medium mb-1">Sort</label>
          <select
            value={sortOrder}
            onChange={(e) => {
              setSortOrder(e.target.value);
              const [field = "(default)", dir = "(default)"] = (e.target.value || "_").split("_");
              track("sort_change", { field, dir });
            }}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">(Default)</option>
            <option value="PriceNum_desc">Price (High to Low)</option>
            <option value="PriceNum_asc">Price (Low to High)</option>
            {/*<option value="SqFtNum_desc">SqFt (High to Low)</option>*/}
            {/*<option value="SqFtNum_asc">SqFt (Low to High)</option>*/}
          </select>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/2">
            <ListingsGrid
              listings={listings}
              hasMore={hasMore}
              loading={loading}
              onExpand={(id) => {
                setExpandedId(id);
                track("listing_expand", { listingId: id });
              }}
              onLoadMore={handleLoadMore}
            />
          </div>

          {/* Only mount Map on desktop */}
          {isDesktop && (
            <div className="hidden lg:block w-full lg:w-1/2 sticky top-[100px] h-[calc(100vh-120px)]">
              <MapView listings={listings} />
            </div>
          )}
        </div>

        {expandedListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => {
                track("listing_overlay_close", { listingId: expandedListing.id, via: "backdrop" });
                closeExpanded();
              }}
            />
            <ListingCard
              listing={expandedListing}
              isExpanded={true}
              onClose={() => {
                track("listing_overlay_close", { listingId: expandedListing.id, via: "button" });
                closeExpanded();
              }}
              onInquire={handleInquire}
              useMobileCarousel={!isDesktop}
            />
          </div>
        )}
        {authModalOpen && <AuthModal onClose={handleAuthSuccess} />}
        <Footer />
      </div>
    </>
  );
}
