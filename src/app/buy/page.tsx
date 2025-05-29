"use client";

import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
import BedBathDropdown from "components/BedBathDropdown";
import PriceDropdown from "components/PriceDropdown";
import CountyCityMultiSelect from "components/CountyCityMultiSelect";
import ListingCard from "components/ListingCard";
import AuthModal from "../../components/AuthModal";
import { useEffect, useState } from "react";
import { getPublicListings } from "../../lib/firestore";
import numeral from "numeral";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
import { app } from "../../lib/firebase";
import { ensureUserDocument } from "../../lib/createUserDoc";
import type { User } from "firebase/auth";

const formatCurrency = (val: string | number) => {
  const raw = typeof val === "string" ? val.replace(/[^\d]/g, "") : val.toString();
  if (!raw) return "";
  const num = Number(raw);
  if (isNaN(num)) return "";
  return numeral(num).format("$0,0");
};

export default function ListingsPage() {
  const [isClient, setIsClient] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [cursor, setCursor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortOrder, setSortOrder] = useState<string>("price_desc");
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
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

  const loadListings = async (reset = false) => {
    setLoading(true);
    const [field, direction] = sortOrder.split('_');

    const { listings: newListings, nextPageCursor } = await getPublicListings({
      pageSize: 40,
      cursor: reset ? null : cursor,
      orderField:
        field === 'price'
          ? 'PriceNum'
          : field === 'sqft'
          ? 'SqFtNum'
          : field === 'beds'
          ? 'BedsNum'
          : 'PriceNum',
      orderDirection: direction as 'asc' | 'desc',
      minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
      beds: filters.beds ? parseInt(filters.beds) : undefined,
      exactBeds: filters.exactBeds,
      baths: filters.baths ? parseInt(filters.baths) : undefined,
      cities: filters.cities.length > 0 ? filters.cities : undefined,
      county: filters.county || undefined,
    });

    setListings(prev => reset ? newListings : [...prev, ...newListings]);
    setCursor(nextPageCursor);
    setHasMore(!!nextPageCursor);
    setLoading(false);
  };

  const handleInquire = async (listing: any) => {
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

  const handleApply = () => {
    setCursor(null);
    setListings([]);
    setHasMore(true);
    loadListings(true);
  };

  const setCities = (value: string[] | ((prev: string[]) => string[])) => {
    setFilters(prev => ({
      ...prev,
      cities: typeof value === 'function' ? value(prev.cities) : value,
    }));
  };

  const setCounty = (value: string | ((prev: string | null) => string | null) | null) => {
    setFilters(prev => ({
      ...prev,
      county: typeof value === 'function' ? value(prev.county) : value,
    }));
  };

  const closeExpanded = () => setExpandedId(null);

  if (!isClient) return null;

  const expandedListing = listings.find(l => l.id === expandedId);

  return (
    <>
      <NavBar />
      <div className="min-h-screen px-6 pb-6 pt-20 bg-gray-50 text-black relative">
        <h1 className="text-3xl font-semibold mb-6">Active Listings</h1>

        <div className="mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium">Sort By</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border px-3 py-2 rounded"
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="sqft_desc">Sqft: High to Low</option>
              <option value="beds_desc">Beds: High to Low</option>
            </select>
          </div>

          <PriceDropdown
            minPrice={filters.minPrice}
            maxPrice={filters.maxPrice}
            setFilters={setFilters}
          />

          <BedBathDropdown filters={filters} setFilters={setFilters} />

          <CountyCityMultiSelect
            selectedCities={filters.cities}
            setSelectedCities={setCities}
            selectedCounty={filters.county}
            setSelectedCounty={setCounty}
          />

          <button
            type="button"
            onClick={handleApply}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Apply
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onExpand={() => setExpandedId(listing.id)}
              isExpanded={false}
            />
          ))}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => loadListings(false)}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        {expandedListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeExpanded}></div>
            <ListingCard
              listing={expandedListing}
              isExpanded={true}
              onClose={closeExpanded}
              onInquire={handleInquire}
            />
          </div>
        )}

        {authModalOpen && <AuthModal onClose={handleAuthSuccess} />}

        <Footer />
      </div>
    </>
  );
}
