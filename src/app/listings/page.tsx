'use client';

import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
import { useEffect, useState } from 'react';
import { getPublicListings } from '../../lib/firestore';

export default function ListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [cursor, setCursor] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortOrder, setSortOrder] = useState<string>('price_asc');
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    beds: '',
    baths: ''
  });

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

  return (
    <>
    <NavBar />
    <div className="min-h-screen p-6 bg-gray-50 text-black">
      
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

        <div>
          <label className="block text-sm font-medium">Min Price</label>
          <input
            name="minPrice"
            value={filters.minPrice}
            onChange={handleFilterChange}
            className="border px-3 py-2 rounded"
            placeholder="$"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Max Price</label>
          <input
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            className="border px-3 py-2 rounded"
            placeholder="$"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Beds</label>
          <input
            name="beds"
            value={filters.beds}
            onChange={handleFilterChange}
            className="border px-3 py-2 rounded"
            placeholder="#"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Baths</label>
          <input
            name="baths"
            value={filters.baths}
            onChange={handleFilterChange}
            className="border px-3 py-2 rounded"
            placeholder="#"
          />
        </div>

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
            <p className="text-sm text-gray-600">
              {listing.Beds} • {listing.Baths} • {listing.SqFt}
            </p>
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
