import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ListingCardProps = {
  listing: any;
  isExpanded?: boolean;
  onExpand?: () => void;
  onClose?: () => void;
  onInquire?: (listing: any) => void;
  /** NEW: when true, expanded view shows single-image with arrows (mobile) */
  useMobileCarousel?: boolean;
};

export default function ListingCard({
  listing,
  isExpanded = false,
  onExpand,
  onClose,
  onInquire,
  useMobileCarousel = false, // NEW
}: ListingCardProps) {
  const images = [listing.Image, listing.Image2, listing.Image3].filter(Boolean);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleCardClick = () => {
    if (!isExpanded && onExpand) {
      onExpand();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white p-4 rounded-2xl border shadow-md ${isExpanded ? 'w-full max-w-5xl z-50 shadow-2xl border-gray-200' : 'cursor-pointer'} ${isExpanded ? '' : 'hover:shadow-lg transition group'}`}
      style={isExpanded ? { overflowY: 'auto', maxHeight: '90vh' } : {}}
    >
      {isExpanded && (
        <button
          onClick={(e) => { e.stopPropagation(); onClose?.(); }}
          className="sticky top-4 left-4 z-50 text-sm text-black flex items-center gap-1 px-1 py-1"
        >
          <span>←</span> Back to Search
        </button>
      )}

      {isExpanded ? (
        /** NEW: on mobile (flagged), show single image + arrows instead of grid */
        useMobileCarousel ? (
          <div className="relative mt-6">
            <div className="w-full overflow-hidden rounded-xl" style={{ aspectRatio: '4 / 3' }}>
              {images[0] && (
                <img
                  src={images[currentImageIndex]}
                  alt="Main"
                  className="w-full h-full object-cover rounded-xl"
                  draggable={false}
                  loading="lazy"
                />
              )}
            </div>
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2"
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
        ) : (
          // Original desktop grid layout (unchanged)
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="col-span-2">
              <img
                src={images[0]}
                alt="Main"
                className="w-full h-full object-cover rounded-xl"
                style={{ aspectRatio: '4 / 3' }}
              />
            </div>
            <div className="flex flex-col gap-4">
              {images[1] && (
                <img
                  src={images[1]}
                  alt="Side 1"
                  className="w-full object-cover rounded-xl"
                  style={{ aspectRatio: '4 / 3' }}
                />
              )}
              {images[2] && (
                <img
                  src={images[2]}
                  alt="Side 2"
                  className="w-full object-cover rounded-xl"
                  style={{ aspectRatio: '4 / 3' }}
                />
              )}
            </div>
          </div>
        )
      ) : images.length > 0 && (
        <div className="relative group">
          <img
            src={images[currentImageIndex]}
            alt="listing"
            className="w-full h-48 object-cover rounded"
          />
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
      )}

      {/* CHANGED: grid is 1 col on mobile so address can use full width */}
      <div className={`mt-6 ${isExpanded ? 'grid grid-cols-1 sm:grid-cols-3 gap-6 items-start' : ''}`}>
        {/* CHANGED: span 2 cols only on sm+ */}
        <div className="sm:col-span-2 space-y-2">
          <h2 className="text-2xl font-bold">{listing.Address}</h2>
          <div className="flex flex-wrap gap-4 text-gray-700">
            <div className="flex items-center gap-2">🛏 {listing.Beds}</div>
            <div className="flex items-center gap-2">🛁 {listing.Baths}</div>
            <div className="flex items-center gap-2">📐 {listing.SqFt}</div>
          </div>
          <p className="text-xl font-bold text-blue-700">{listing.Price}</p>
        </div>

        {isExpanded && (
          <>
            {/* Desktop layout (unchanged) */}
            <div className="hidden sm:flex flex-col items-end gap-3 border border-gray-300 p-4 rounded-lg w-full">
              <div className="w-full flex flex-col items-end max-w-full">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onInquire?.(listing);
                  }}
                  className="bg-blue-600 text-white py-2 px-6 text-sm rounded hover:bg-blue-700 w-full"
                >
                  Inquire
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white text-blue-600 border border-blue-600 py-2 px-6 text-sm rounded hover:bg-blue-50 w-full mt-2"
                >
                  Contact Agent
                </button>
              </div>
            </div>

            {/* Mobile fixed bottom bar */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 p-4 z-50">
              <div className="flex flex-col gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onInquire?.(listing);
                  }}
                  className="bg-blue-600 text-white py-3 text-sm rounded hover:bg-blue-700 w-full"
                >
                  Inquire
                </button>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white text-blue-600 border border-blue-600 py-3 text-sm rounded hover:bg-blue-50 w-full"
                >
                  Contact Agent
                </button>
              </div>
            </div>
          </>
        )}

      </div>

      {!isExpanded && (
        <span className="absolute bottom-2 right-3 text-2xl text-gray-400">⋯</span>
      )}
    </div>
  );
}
