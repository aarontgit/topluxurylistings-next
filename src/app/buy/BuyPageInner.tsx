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
import GoogleMapsLoader from "../../components/GoogleMapsLoader";
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
  const [searchLocationLabel, setSearchLocationLabel] = useState<string | null>(null); // ✅ existing

  // ✅ NEW: runtime media query to know if desktop (lg: 1024px)
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

  // ✅ Mobile filters toggle state (moved up to keep hook order stable)
  const [showFilters, setShowFilters] = useState(false);

  const searchParams = useSearchParams();
  const inputFromParams = searchParams.get("input");

  useEffect(() => {
    if (inputFromParams && searchInput !== inputFromParams) {
      setSearchInput(inputFromParams);
    }
  }, [inputFromParams]);

  useEffect(() => {
    const zip = searchParams.get("zip") ?? "";
    const city = searchParams.get("city") ?? "";
    const county = searchParams.get("county") ?? "";

    if (zip) {
      setFilters((prev) => ({ ...prev, cities: [], county: null }));
      setIsZip(true);
    } else if (city) {
      setFilters((prev) => ({ ...prev, cities: [city], county: null }));
      setIsZip(false);
    } else if (county) {
      const fullCounty = county.includes("County") ? county : `${county} County`;
      setFilters((prev) => ({ ...prev, cities: [], county: fullCounty }));
      setIsZip(false);
    }
  }, []);

  useEffect(() => {
    if (!searchInput.trim() || justSearchedFromAutocomplete) return;

    const zip = searchParams.get("zip") ?? "";
    const city = searchParams.get("city") ?? "";
    const county = searchParams.get("county") ?? "";

    const shouldSearch = zip || city || county;
    if (!shouldSearch) return;

    const zipOverride = zip || undefined;
    const cityOverride = city || undefined;
    const countyOverride = county || undefined;

    handleSearchWithFilters(searchInput.trim(), cityOverride, countyOverride, zipOverride);
    setJustSearchedFromAutocomplete(false);
  }, [filters, searchInput]);

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

  useEffect(() => {
    if (justSearchedFromAutocomplete) {
      setJustSearchedFromAutocomplete(false);
      return;
    }

    const { cities, county, minPrice, maxPrice, beds, baths } = filters;
    const trimmedInput = searchInput.trim();
    const isZip = /^\d{5}$/.test(trimmedInput);

    const shouldSearch =
      cities.length > 0 || !!county || !!minPrice || !!maxPrice || !!beds || !!baths || isZip;

    if (!shouldSearch) return;

    handleSearchWithFilters(
      trimmedInput,
      undefined,
      county ?? undefined,
      isZip && cities.length === 0 && !county ? trimmedInput : undefined
    );
  }, [filters, searchInput]);

  useEffect(() => {
    handleSearchWithFilters(searchInput.trim(), undefined, filters.county ?? undefined);
  }, [sortOrder]);

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

  const handleSearchWithFilters = async (
    input: string,
    cityOverride?: string,
    countyOverride?: string,
    zipOverride?: string,
    cursorParam: QueryDocumentSnapshot<DocumentData> | null = null,
  ) => {
    if (/^\d{5}$/.test(input) && !zipOverride) {
      setIsZip(true);
      setFilters((prev) => ({ ...prev, cities: [], county: null }));
      setSearchLocationLabel(`ZIP Code ${input}`);
      handleSearchWithFilters(input, undefined, undefined, input);
      return;
    }
  
    setSearchLocationLabel(input);
  
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
        pageSize: isDesktop ? 40 : 20, // ✅ fewer on mobile
        cursor: cursorParam,
        orderField: field,
        orderDirection: direction,
        minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
        beds: filters.beds ? parseInt(filters.beds) : undefined,
        exactBeds: filters.exactBeds,
        baths: filters.baths ? parseInt(filters.baths) : undefined,
  
        // ⬇️ CHANGED: cities now override county when present
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
    setSearchLocationLabel(input);

    if (zip) {
      setFilters((prev) => ({ ...prev, cities: [], county: null }));
      handleSearchWithFilters(input, undefined, undefined, zip, null);
    } else if (county === "Denver County") {
      setFilters((prev) => ({ ...prev, cities: [], county: "Denver County" }));
      handleSearchWithFilters(input, undefined, "Denver County", undefined, null);
    } else {
      setFilters((prev) => ({
        ...prev,
        cities: city ? [city] : [],
        county: county ?? null,
      }));
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
      pageSize: isDesktop ? 40 : 20, // ✅ fewer on mobile
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
    handleSearchWithFilters(searchInput, undefined, filters.county ?? undefined, undefined, cursorDoc);
  };

  const setCities = (value: string[] | ((prev: string[]) => string[])) => {
    setFilters(prev => ({
      ...prev,
      cities: typeof value === 'function' ? value(prev.cities) : value,
    }));
  };

  const setCounty = (
    value: string | ((prev: string | null) => string | null) | null
  ) => {
    setFilters(prev => ({
      ...prev,
      county: typeof value === 'function' ? value(prev.county) : value,
      cities: [],
    }));
  };

  const closeExpanded = () => setExpandedId(null);
  const expandedListing = listings.find(l => l.id === expandedId);

  if (!isClient) return null;

  return (
    <>
      <NavBar />
      <div className="min-h-screen px-6 pb-6 pt-20 bg-gray-50 text-black relative">

        {/* ✅ Mobile-only sticky SearchBar (centered & full width) */}
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

        {/* ✅ Mobile Filters toggle */}
        <div className="lg:hidden mb-3">
          <button
            onClick={() => setShowFilters(prev => !prev)}
            aria-expanded={showFilters}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded"
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {/* ✅ Desktop filters: sticky & always visible */}
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

        {/* ✅ Mobile filters as a TOP modal (over everything) */}
        {showFilters && (
          <div className="lg:hidden fixed inset-0 z-[100]">
            {/* overlay */}
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowFilters(false)}
              aria-hidden="true"
            />
            {/* sheet at the TOP */}
            <div className="absolute top-0 left-0 right-0 max-h-[90vh] bg-white rounded-b-2xl shadow-2xl p-4 overflow-visible">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
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
                onClick={() => setShowFilters(false)}
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
            onChange={(e) => setSortOrder(e.target.value)}
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
              onExpand={(id) => setExpandedId(id)}
              onLoadMore={handleLoadMore}
            />
          </div>

        {/* ✅ Only mount Map on desktop */}
          {isDesktop && (
            <div className="hidden lg:block w-full lg:w-1/2 sticky top-[100px] h-[calc(100vh-120px)]">
              <MapView listings={listings} />
            </div>
          )}
        </div>

        {expandedListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeExpanded}></div>
            <ListingCard
              listing={expandedListing}
              isExpanded={true}
              onClose={closeExpanded}
              onInquire={handleInquire}
              useMobileCarousel={!isDesktop} // ✅ only necessary change
            />
          </div>
        )}
        {authModalOpen && <AuthModal onClose={handleAuthSuccess} />}
        <Footer />
      </div>
    </>
  );
}
