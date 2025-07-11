"use client";

import { useState } from "react";
import { Autocomplete } from "@react-google-maps/api";
import { useEffect } from "react";
import Portal from "./Portal";

export default function SearchBar({
  value,
  onChange,
  onSearch,
  inputClassName = "",
}: {
  value: string;
  onChange: (val: string) => void;
  onSearch: (
    input: string,
    cityOverride?: string,
    countyOverride?: string,
    zipOverride?: string
  ) => void;
    inputClassName?: string;
}) {
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timeout);
    }
  }, [error]);
  

  const handlePlaceChanged = () => {
    if (!autocomplete) return;
  
    const place = autocomplete.getPlace();
    const formatted = place.formatted_address || place.name || "";
    const components = place.address_components || [];
    const state = components.find(c => c.types.includes("administrative_area_level_1"))?.short_name;

    if (state !== "CO") {
        setError("Please choose a location in Colorado.");
        return;
    }
  
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
      <Autocomplete
        onLoad={(auto) => {
            auto.setComponentRestrictions({ country: "us" });

            auto.setOptions({
            bounds: new google.maps.LatLngBounds(
                new google.maps.LatLng(36.9, -109.1),
                new google.maps.LatLng(41.0, -102.0)
            ),
            strictBounds: true,
            } as google.maps.places.AutocompleteOptions);

            setAutocomplete(auto);
        }}
        onPlaceChanged={handlePlaceChanged}
        >
        <div className="relative w-full">
            
        {error && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
                <div className="bg-red-500 text-white text-sm px-4 py-2 rounded shadow animate-fade">
                {error}
                </div>
            </div>
            )}



            

            <input
            type="text"
            className={`flex-1 border border-gray-300 p-3 rounded ${inputClassName}`}
            placeholder="Search by address, zip code, city, or county"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                e.preventDefault();
                const zipMatch = value.match(/\b\d{5}\b/);
                const hasStreet = /\d+ [^\d]+/.test(value);
                if (hasStreet && zipMatch) {
                    onSearch(value, undefined, undefined, zipMatch[0]);
                } else if (zipMatch) {
                    onSearch(zipMatch[0], undefined, undefined, zipMatch[0]);
                } else if (value.toLowerCase().includes("county")) {
                    onSearch(value, undefined, value);
                } else {
                    onSearch(value, value);
                }
                }
            }}
            />
        </div>
        </Autocomplete>

      </div>
    </div>
  );
}
