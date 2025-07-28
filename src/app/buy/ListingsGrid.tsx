"use client";

import ListingCard from "../../components/ListingCard";

type Listing = {
  id: string;
  Address?: string;
  [key: string]: any;
};

export default function ListingsGrid({
  listings,
  hasMore,
  loading,
  onExpand,
  onLoadMore,
}: {
  listings: Listing[];
  hasMore: boolean;
  loading: boolean;
  onExpand: (id: string) => void;
  onLoadMore: () => void;
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {listings.map((listing) => (
          <ListingCard
            key={`${listing.id}-${listing.Address}`}
            listing={listing}
            onExpand={() => onExpand(listing.id)}
            isExpanded={false}
          />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </>
  );
}
