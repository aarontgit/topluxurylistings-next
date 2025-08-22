import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";

type ListingCardProps = {
  listing: any;
  isExpanded?: boolean;
  onExpand?: () => void;
  onClose?: () => void;
  onInquire?: (listing: any) => void;
  useMobileCarousel?: boolean;
};

export default function ListingCard({
  listing,
  isExpanded = false,
  onExpand,
  onClose,
  onInquire,
  useMobileCarousel = false,
}: ListingCardProps) {
  const images = [listing.Image, listing.Image2, listing.Image3].filter(Boolean);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // --- GA helper (inline) ---
  const track = (name: string, params?: Record<string, any>) =>
    (window as any)?.gtag?.("event", name, params || {});
  const listingId = listing?.id || listing?.MLSId || listing?.mlsId || "(unknown)";

  // Fire once when expanded detail renders
  const viewedOnce = useRef(false);
  useEffect(() => {
    if (isExpanded && !viewedOnce.current) {
      track("listing_detail_view", { listingId, images: images.length });
      viewedOnce.current = true;
    }
  }, [isExpanded, images.length]);

  // Fire when monthly payment is visible (expanded only)
  useEffect(() => {
    if (isExpanded) {
      const mp = getMonthlyPayment();
      if (mp != null) track("listing_payment_calc_shown", { listingId, monthlyPayment: mp });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded]);

  const prevImage = () => {
    setCurrentImageIndex((prev) => {
      const next = prev === 0 ? images.length - 1 : prev - 1;
      track("listing_image_change", {
        listingId,
        action: "prev",
        index: next,
        total: images.length,
        expanded: isExpanded,
        carousel: useMobileCarousel,
      });
      return next;
    });
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => {
      const next = prev === images.length - 1 ? 0 : prev + 1;
      track("listing_image_change", {
        listingId,
        action: "next",
        index: next,
        total: images.length,
        expanded: isExpanded,
        carousel: useMobileCarousel,
      });
      return next;
    });
  };

  const handleCardClick = () => {
    if (!isExpanded && onExpand) {
      track("listing_expand_click", { listingId, source: "card" });
      onExpand();
    }
  };

  const getMonthlyPayment = () => {
    if (!listing.Price) return null;
    const priceNumber = parseFloat(listing.Price.replace(/[^0-9.-]+/g, ""));
    if (isNaN(priceNumber)) return null;
    return priceNumber / 143.165;
  };

  const monthlyPayment = getMonthlyPayment();

  const ListingImage = ({
    src,
    className,
    style,
    overlayRoundedClass = "rounded-xl",
  }: {
    src: string;
    className?: string;
    style?: React.CSSProperties;
    overlayRoundedClass?: string;
  }) => {
    const [broken, setBroken] = useState(false);
    return (
      <div className={`relative ${className || ""}`} style={style}>
        {!broken ? (
          <img
            src={src}
            alt="Listing"
            className="w-full h-full object-cover"
            draggable={false}
            loading="lazy"
            onError={() => {
              setBroken(true);
              track("listing_image_error", { listingId, src, expanded: isExpanded });
            }}
          />
        ) : (
          <div
            className={`absolute inset-0 grid place-items-center bg-gray-200 ${overlayRoundedClass}`}
          >
            <div className="flex flex-col items-center">
              <Lock className="w-10 h-10 text-gray-600 opacity-80" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white p-4 rounded-2xl border shadow-md ${
        isExpanded ? "w-full max-w-5xl z-50 shadow-2xl border-gray-200" : "cursor-pointer"
      } ${isExpanded ? "" : "hover:shadow-lg transition group"}`}
    >
      {isExpanded && (
        <div className="mt-2 mb-4 flex items-center justify-between relative">
          {/* Left-aligned back button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              track("listing_back_click", { listingId, via: "button" });
              onClose?.();
            }}
            className="z-50 text-sm text-black flex items-center gap-1 px-1 py-1"
          >
            <span>←</span> Back to Search
          </button>

          {/* Centered logo + title (desktop only) */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 hidden sm:flex">
            <img src="/logo.png" alt="Top Luxury Listings Logo" className="h-8 w-auto" />
            <h1 className="text-xl font-bold whitespace-nowrap">Top Luxury Listings</h1>
          </div>
        </div>
      )}

      {isExpanded ? (
        useMobileCarousel ? (
          <div className="relative mt-6">
            <div className="w-full overflow-hidden rounded-xl" style={{ aspectRatio: "4 / 3" }}>
              {images[0] && (
                <ListingImage
                  src={images[currentImageIndex]}
                  className="w-full h-full rounded-xl"
                  overlayRoundedClass="rounded-xl"
                />
              )}
            </div>
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2"
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="col-span-2">
              <ListingImage
                src={images[0]}
                className="w-full h-full rounded-xl"
                style={{ aspectRatio: "4 / 3" }}
                overlayRoundedClass="rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-4">
              {images[1] && (
                <ListingImage
                  src={images[1]}
                  className="w-full rounded-xl"
                  style={{ aspectRatio: "4 / 3" }}
                  overlayRoundedClass="rounded-xl"
                />
              )}
              {images[2] && (
                <ListingImage
                  src={images[2]}
                  className="w-full rounded-xl"
                  style={{ aspectRatio: "4 / 3" }}
                  overlayRoundedClass="rounded-xl"
                />
              )}
            </div>
          </div>
        )
      ) : (
        images.length > 0 && (
          <div className="relative group">
            <ListingImage src={images[currentImageIndex]} className="w-full h-48 rounded" overlayRoundedClass="rounded" />
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
        )
      )}

      <div className={`mt-6 ${isExpanded ? "grid grid-cols-1 sm:grid-cols-3 gap-6 items-start" : ""}`}>
        <div className="sm:col-span-2 space-y-2">
          <h2 className="text-2xl font-bold">{listing.Address}</h2>
          <div className="flex flex-wrap gap-4 text-gray-700">
            <div className="flex items-center gap-2">🛏 {listing.Beds}</div>
            <div className="flex items-center gap-2">🛁 {listing.Baths}</div>
            <div className="flex items-center gap-2">📐 {listing.SqFt}</div>
          </div>
          <p className="text-xl font-bold text-blue-700">{listing.Price}</p>

          {isExpanded && monthlyPayment !== null && (
            <p className="text-sm text-gray-600">
              Est. Monthly Payment: ${monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
        </div>

        {isExpanded && (
          <>
            <div className="hidden sm:flex flex-col items-end gap-3 border border-gray-300 p-4 rounded-lg w-full">
              <div className="w-full flex flex-col items-end max-w-full">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    track("listing_inquire_click", { listingId, location: "sidebar" });
                    onInquire?.(listing);
                  }}
                  className="bg-blue-600 text-white py-2 px-6 text-sm rounded hover:bg-blue-700 w-full"
                >
                  Request Showing
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    track("listing_contact_agent_click", { listingId, location: "sidebar" });
                  }}
                  className="bg-white text-blue-600 border border-blue-600 py-2 px-6 text-sm rounded hover:bg-blue-50 w-full mt-2"
                >
                  Contact Agent
                </button>
              </div>
            </div>

            {/* Mobile expanded card */}
            <div className="sm:hidden sticky bottom-0 bg-white border-t border-gray-300 p-4 z-50">
              <div className="flex flex-col gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    track("listing_inquire_click", { listingId, location: "mobile_cta" });
                    onInquire?.(listing);
                  }}
                  className="bg-blue-600 text-white py-3 text-sm rounded hover:bg-blue-700 w-full"
                >
                  Request Showing
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    track("listing_contact_agent_click", { listingId, location: "mobile_cta" });
                  }}
                  className="bg-white text-blue-600 border border-blue-600 py-3 text-sm rounded hover:bg-blue-50 w-full"
                >
                  Contact Agent
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {!isExpanded && <span className="absolute bottom-2 right-3 text-2xl text-gray-400">⋯</span>}
    </div>
  );
}
