// components/GoogleMapsLoader.tsx
"use client";

import { GoogleMap, Marker, useJsApiLoader , LoadScript } from "@react-google-maps/api";

const libraries: ("places")[] = ["places"];

export default function GoogleMapsLoader({ children }: { children: React.ReactNode }) {
  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
      libraries={libraries}
      version="weekly" 
    >
      {children}
    </LoadScript>
  );
}
