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

  // --- GA helper (no PII sent) ---
  const track = (name: string, params?: Record<string, any>) =>
    (window as any)?.gtag?.("event", name, params || {});

  useEffect(() => {
    if (error) {
      track("search_error_show", { type: "out_of_state" });
      const timeout = setTimeout(() => {
        setError("");
        track("search_error_hide", { type: "out_of_state" });
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  const handlePlaceChanged = () => {
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    const formatted = place.formatted_address || place.name || "";
    const components = place.address_components || [];
    const state = components.find(c => c.types.includes("administrative_area_level_1"))?.short_name;

    if (state && state !== "CO") {
      setError("Please choose a location in Colorado.");
      track("search_restricted_state", { state });
      return;
    }

    const streetNumber = components.find((c) => c.types.includes("street_number"));
    const route = components.find((c) => c.types.includes("route"));
    const postalCode = components.find((c) => c.types.includes("postal_code"));
    const city = components.find((c) => c.types.includes("locality"))?.long_name;
    const county = components.find((c) => c.types.includes("administrative_area_level_2"))?.long_name;

    const isFullAddress = !!(streetNumber && route);

    let zipGuess = postalCode?.long_name;
    if (!zipGuess) {
      const zipMatch = formatted.match(/\b\d{5}\b/);
      if (zipMatch) zipGuess = zipMatch[0];
    }

    // classify without sending raw address
    let classification: "county" | "full_address" | "zip" | "city" | "free_text" = "free_text";
    if (formatted.includes("Denver County")) classification = "county";
    else if (isFullAddress) classification = "full_address";
    else if (zipGuess) classification = "zip";
    else if (city) classification = "city";
    else if (county) classification = "county";

    track("searchbar_submit", {
      method: "place",
      classification,
      city: city || null,
      county: county ? (county.includes("County") ? county : `${county} County`) : null,
      zip: zipGuess || null,
      is_full_address: isFullAddress,
    });

    onChange(formatted);

    // Original routing logic unchanged, but note: we never send the raw address to GA
    if (formatted.includes("Denver County")) {
      onSearch("Denver County", undefined, "Denver County");
    } else if (isFullAddress) {
      onSearch(formatted, city, county, zipGuess);
    } else if (zipGuess) {
      onSearch(zipGuess, undefined, undefined, zipGuess);
    } else if (city) {
      onSearch(city, city);
    } else if (county) {
      const fullCounty = county.includes("County") ? county : `${county} County`;
      if (city && city === county) {
        onSearch(fullCounty, undefined, fullCounty);
      } else {
        onSearch(city || fullCounty, city || undefined, fullCounty);
      }
    } else {
      onSearch(formatted);
    }
  };

  return (
    <div className="w-full lg:max-w-2xl">
      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
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
              track("search_autocomplete_load");
              track("search_autocomplete_restrict", {
                country: "us",
                strict_bounds: true,
                region: "CO",
              });
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
                className={`w-full border border-gray-300 p-3 rounded ${inputClassName}`}
                placeholder="Search by address, zip code, city, or county"
                value={value}
                onFocus={() => track("search_input_focus")}
                onBlur={() => track("search_input_blur", { len: value.length })}
                onChange={(e) => {
                  // Don’t send raw text—just length
                  const v = e.target.value;
                  onChange(v);
                  track("search_input_change", { len: v.length });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const zipMatch = value.match(/\b\d{5}\b/);
                    const hasStreet = /\d+ [^\d]+/.test(value);

                    // classify the free-text submit
                    let classification: "full_address" | "zip" | "county" | "city" | "free_text" =
                      "free_text";
                    if (hasStreet && zipMatch) classification = "full_address";
                    else if (zipMatch) classification = "zip";
                    else if (value.toLowerCase().includes("county")) classification = "county";
                    else if (value.trim().length > 0) classification = "city";

                    track("searchbar_submit", {
                      method: "enter",
                      classification,
                      // we still avoid sending the raw text; include only safe hints
                      zip: zipMatch ? zipMatch[0] : null,
                      query_len: value.length,
                    });

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
    </div>
  );
}
