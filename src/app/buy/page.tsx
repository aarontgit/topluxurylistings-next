'use client';

import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
import BedBathDropdown from "components/BedBathDropdown";
import PriceDropdown from "components/PriceDropdown";
import { useEffect, useState } from 'react';
import { getPublicListings } from '../../lib/firestore';
import numeral from 'numeral';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { app,  db } from "../../lib/firebase";
import type { User } from "firebase/auth";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";





const formatCurrency = (val: string | number) => {
    const raw = typeof val === 'string' ? val.replace(/[^\d]/g, '') : val.toString();
  
    if (!raw) return ''; // ✅ returns empty string if input is empty
  
    const num = Number(raw);
    if (isNaN(num)) return '';
    return numeral(num).format('$0,0');
  };

  
      
       

export default function ListingsPage() {
  const [isClient, setIsClient] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [cursor, setCursor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortOrder, setSortOrder] = useState<string>('price_desc');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    beds: '',
    baths: '',
    exactBeds: false,
  });

  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  const [user, setUser] = useState<User | null>(null);

  const handleInquire = async (listing: any) => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
  
    try {
      // 🔐 Sign in if not already
      if (!auth.currentUser) {
        await signInWithPopup(auth, provider);
      }
  
      const idToken = await auth.currentUser?.getIdToken();
  
      if (!idToken) throw new Error("Could not retrieve ID token");
  
      const res = await fetch('/api/inquire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken,
          address: listing.Address,
        }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.error || 'Failed to inquire');
      }
  
      alert(`Thanks for your interest in ${listing.Address}! We'll be in touch soon.`);
    } catch (err: any) {
      console.error('❌ Inquiry error:', err.message);
      alert("There was a problem submitting your inquiry.");
    }
  };
  
  
 

  useEffect(() => {
    setIsClient(true);
    loadListings(true);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const loadListings = async (reset = false) => {
    setLoading(true);

    
    
    



    const [field, direction] = sortOrder.split('_');

    const { listings: newListings, nextPageCursor } = await getPublicListings({
      pageSize: 40,
      cursor: reset ? null : cursor,
      orderField: field === 'price' ? 'PriceNum' : field === 'sqft' ? 'SqFtNum' : field === 'beds' ? 'BedsNum' : 'PriceNum',
      orderDirection: direction as 'asc' | 'desc',
      minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
      beds: filters.beds ? parseInt(filters.beds) : undefined,
      exactBeds: filters.exactBeds,
      baths: filters.baths ? parseInt(filters.baths) : undefined,
    });

    setListings(prev => reset ? newListings : [...prev, ...newListings]);
    setCursor(nextPageCursor);
    setHasMore(!!nextPageCursor);
    setLoading(false);
  };

  const handleApply = () => {
    setCursor(null);
    setListings([]);
    setHasMore(true);
    loadListings(true);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  if (!isClient) return null;

  return (
    <>
    <NavBar />
    <div className="min-h-screen px-6 pb-6 pt-20 bg-gray-50 text-black">
      
      <h1 className="text-3xl font-semibold mb-6">Active Listings in Denver</h1>

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
          <div key={listing.id} className="bg-white p-4 rounded shadow hover:shadow-md transition">
            <img
              src={listing.Image}
              alt={`Preview of ${listing.Address}`}
              className="w-full h-48 object-cover rounded mb-4"
            />
            <h2 className="text-lg font-medium mb-1">{listing.Address}</h2>
            <p className="text-blue-700 font-semibold mb-1">{listing.Price}</p>
            <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
                {listing.Beds} • {listing.Baths} • {listing.SqFt}
            </p>
            <button
                onClick={() => handleInquire(listing)}
                className="text-sm bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700"
            >
                Inquire
            </button>
            </div>

          </div>
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

      <Footer />
    </div>
    </>
  );
}
