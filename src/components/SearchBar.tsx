"use client";

import { useState } from "react";
import { Autocomplete } from "@react-google-maps/api";

export default function SearchBar({
  value,
  onChange,
  onSearch,
}: {
  value: string;
  onChange: (val: string) => void;
  onSearch: (
    input: string,
    cityOverride?: string,
    countyOverride?: string,
    zipOverride?: string
  ) => void;
}) {
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const [error, setError] = useState("");

  const handlePlaceChanged = () => {
    if (!autocomplete) return;
  
    const place = autocomplete.getPlace();
    const formatted = place.formatted_address || place.name || "";
    const components = place.address_components || [];
  
    const streetNumber = components.find((c) => c.types.includes("street_number"));
    const route = components.find((c) => c.types.includes("route"));
    const postalCode = components.find((c) => c.types.includes("postal_code"));
    const city = components.find((c) => c.types.includes("locality"))?.long_name;
    const county = components.find((c) => c.types.includes("administrative_area_level_2"))?.long_name;
  
    const isFullAddress = streetNumber && route;
  
    let zipGuess = postalCode?.long_name;
    if (!zipGuess) {
      const zipMatch = formatted.match(/\b\d{5}\b/);
      if (zipMatch) {
        zipGuess = zipMatch[0];
      }
    }
  
    console.log("📍 handlePlaceChanged:", {
      formatted,
      isFullAddress,
      zipGuess,
      city,
      county,
    });
  
    onChange(formatted);
  
    if (isFullAddress) {
      onSearch(formatted, city, county, zipGuess);
    } else if (zipGuess) {
        // Treat ZIP as primary filter, no city/county
        onSearch(zipGuess, undefined, undefined, zipGuess);      
    } else if (city) {
      onSearch(city, city);
    } else if (county) {
      const fullCounty = county.includes("County") ? county : `${county} County`;
      onSearch(fullCounty, undefined, fullCounty);
    } else {
      onSearch(formatted);
    }
  };
  

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex gap-2">
        <Autocomplete onLoad={setAutocomplete} onPlaceChanged={handlePlaceChanged}>
          <input
            type="text"
            className="flex-1 border border-gray-300 p-3 rounded"
            placeholder="Search by address, zip code, city, or county"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
              
                  const zipMatch = value.match(/\b\d{5}\b/);
                  const hasStreet = /\d+ [^\d]+/.test(value); // detects addresses like "123 Main St"
              
                  if (hasStreet && zipMatch) {
                    // Treat as full address, extract ZIP
                    onSearch(value, undefined, undefined, zipMatch[0]);
                  } else if (zipMatch) {
                    // ZIP only
                    onSearch(zipMatch[0], undefined, undefined, zipMatch[0]);
                  } else if (value.toLowerCase().includes("county")) {
                    // County input
                    onSearch(value, undefined, value);
                  } else {
                    // Fallback to city
                    onSearch(value, value);
                  }
                }
              }}
              
          />
        </Autocomplete>
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
