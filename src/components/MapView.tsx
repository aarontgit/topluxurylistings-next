"use client";

import { GoogleMap, OverlayView } from "@react-google-maps/api";
import { useEffect, useMemo, useRef, useState } from "react";
import ListingCard from "./ListingCard";
import numeral from "numeral";
import { createPortal } from "react-dom";

type Listing = {
  id: string;
  Address?: string;
  PriceNum?: number;
  GeoPoint?: { latitude: number; longitude: number };
  [key: string]: any;
};

const containerStyle = {
  width: "100%",
  height: "100%",
};

const centerOfColorado = {
  lat: 39.5501,
  lng: -105.7821,
};

export default function MapView({ listings }: { listings: Listing[] }) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cardDirection, setCardDirection] = useState<"above" | "below">("above");
  const [cardXOffset, setCardXOffset] = useState<string>("-50%");
  const [isExpanded, setIsExpanded] = useState(false);

  const markers = useMemo(
    () =>
      listings
        .filter((l) => l.GeoPoint?.latitude && l.GeoPoint?.longitude)
        .map((l) => ({
          id: l.id,
          lat: l.GeoPoint!.latitude,
          lng: l.GeoPoint!.longitude,
          price: l.PriceNum ?? 0,
        })),
    [listings]
  );

  const selectedListing = listings.find((l) => l.id === selectedId);

  useEffect(() => {
    if (mapRef.current && markers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
      mapRef.current.fitBounds(bounds);
    }
  }, [markers]);

  return (
    <div className="w-full h-[500px] lg:h-[calc(100vh-100px)] rounded overflow-hidden shadow-md">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={centerOfColorado}
        zoom={8}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        onClick={() => {
          setSelectedId(null);
          setIsExpanded(false);
        }}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        }}
      >
        {markers.map((marker) => (
          <PriceMarker
            key={marker.id}
            lat={marker.lat}
            lng={marker.lng}
            price={marker.price}
            onClick={() => {
              setSelectedId(marker.id);
              setIsExpanded(false);
            }}
          />
        ))}

        {selectedListing?.GeoPoint && !isExpanded && (
          <OverlayView
            key={`card-${selectedListing.id}`}
            position={{
              lat: selectedListing.GeoPoint.latitude,
              lng: selectedListing.GeoPoint.longitude,
            }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div
              style={{
                position: "absolute",
                width: "300px",
                transform:
                  cardDirection === "above"
                    ? `translate(${cardXOffset}, calc(-100% - 40px))`
                    : `translate(${cardXOffset}, 10px)`,
                zIndex: 9999999,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
            >
              <ListingCard
                listing={selectedListing}
                isExpanded={false}
                onClose={() => setSelectedId(null)}
              />
            </div>
          </OverlayView>
        )}

        {selectedListing?.GeoPoint && (
          <OverlayView
            key={`projection-${selectedListing.id}`}
            position={{
              lat: selectedListing.GeoPoint.latitude,
              lng: selectedListing.GeoPoint.longitude,
            }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            onLoad={(overlay) => {
              const projection = overlay.getProjection();
              if (!projection || !mapRef.current) return;

              const latLng = new google.maps.LatLng(
                selectedListing.GeoPoint!.latitude,
                selectedListing.GeoPoint!.longitude
              );

              const point = projection.fromLatLngToContainerPixel(latLng);
              if (!point) return;

              const cardHeight = 160;
              const cardWidth = 300;
              const padding = 20;
              const visibleTop = 0;
              const visibleBottom = window.innerHeight;
              const windowWidth = window.innerWidth;

              const cardTop = point.y + (point.y < window.innerHeight / 2 ? 10 : -cardHeight);
              const needsPanUp = cardTop < visibleTop + padding;
              const needsPanDown = cardTop + cardHeight > visibleBottom - padding;

              const direction = point.y < window.innerHeight / 2 ? "below" : "above";
              setCardDirection(direction);

              let xOffset = "-50%";
              if (point.x - cardWidth / 2 < 0) {
                xOffset = "0%";
              } else if (point.x + cardWidth / 2 > windowWidth) {
                xOffset = "-100%";
              }
              setCardXOffset(xOffset);

              if (needsPanUp || needsPanDown) {
                const deltaY = needsPanUp ? -cardHeight / 2 : cardHeight / 2;
                const adjustedPoint = new google.maps.Point(point.x, point.y + deltaY);
                const newCenter = projection.fromContainerPixelToLatLng(adjustedPoint);
                if (newCenter) {
                  mapRef.current.panTo(newCenter);
                }
              }
            }}
          >
            <div style={{ display: "none" }} />
          </OverlayView>
        )}
      </GoogleMap>

      {isExpanded && selectedListing && createPortal(
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[99999] flex items-center justify-center"
          onClick={() => {
            setSelectedId(null);
            setIsExpanded(false);
          }}
        >
          <div
            className="bg-white w-full max-w-3xl rounded-lg shadow-lg overflow-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <ListingCard
              listing={selectedListing}
              isExpanded={true}
              onClose={() => {
                setSelectedId(null);
                setIsExpanded(false);
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function PriceMarker({
  lat,
  lng,
  price,
  onClick,
}: {
  lat: number;
  lng: number;
  price: number;
  onClick?: () => void;
}) {
  const formattedPrice = numeral(price).format("$0.[00]a").toUpperCase();

  return (
    <OverlayView
      position={{ lat, lng }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div style={{ pointerEvents: "none" }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="relative bg-red-700 text-white font-semibold text-sm px-3 py-1 rounded-full shadow cursor-pointer whitespace-nowrap inline-block"
          style={{
            pointerEvents: "auto",
            transform: "translate(-50%, -100%)",
            zIndex: 9999,
          }}
        >
          {formattedPrice}
          <div
            className="absolute"
            style={{
              left: "50%",
              bottom: -5,
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid #B91C1C",
            }}
          />
        </div>
      </div>
    </OverlayView>
  );
}