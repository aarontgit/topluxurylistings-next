"use client";

import { Popover } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useEffect, useRef, useState } from 'react';
import countyCityMap from '../data/countyCityMap.json';

interface CountyCityMultiSelectProps {
  selectedCities: string[];
  setSelectedCities: React.Dispatch<React.SetStateAction<string[]>>;
  selectedCounty: string | null;
  setSelectedCounty: React.Dispatch<React.SetStateAction<string | null>>;
}

const typedCountyCityMap: Record<string, string[]> = countyCityMap as Record<string, string[]>;
const allCounties = Object.keys(typedCountyCityMap);
const allCities = Array.from(
  new Set(Object.values(typedCountyCityMap).flat().filter(city => city.length > 1 && !/\d/.test(city)))
).sort();

export default function CountyCityMultiSelect({
  selectedCities,
  setSelectedCities,
  selectedCounty,
  setSelectedCounty,
}: CountyCityMultiSelectProps) {
  const [filteredCities, setFilteredCities] = useState<string[]>(allCities);
  const [citySearch, setCitySearch] = useState('');

  // --- GA helper ---
  const track = (name: string, params?: Record<string, any>) =>
    (window as any)?.gtag?.("event", name, params || {});
  const citiesToParam = (arr: string[]) => (arr ?? []).slice(0, 20).join("|"); // keep param small

  // Refilter cities when county or search changes
  useEffect(() => {
    const allRelevantCities =
      selectedCounty && typedCountyCityMap[selectedCounty]
        ? typedCountyCityMap[selectedCounty]
        : allCities;

    const filtered = allRelevantCities
      .filter(city => city.toLowerCase().includes(citySearch.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));

    setFilteredCities(filtered);
  }, [selectedCounty, citySearch]);

  const toggleCity = (city: string) => {
    setSelectedCities(prev => {
      const exists = prev.includes(city);
      track("city_toggle", { city, action: exists ? "remove" : "add" });
      return exists ? prev.filter(c => c !== city) : [...prev, city];
    });
  };

  const label = `${selectedCounty || 'Any County'} / ${
    Array.isArray(selectedCities) && selectedCities.length > 0
      ? selectedCities.join(', ')
      : 'Any City'
  }`;

  // For open/close + apply detection
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const initialCountyRef = useRef<string | null>(null);
  const initialCitiesRef = useRef<string>(""); // pipe-joined snapshot
  const closeViaRef = useRef<"toggle_button"|"outside_click"|"escape"|"unknown"|null>(null);

  // Watch outside clicks & Esc while open
  function OpenWatcher({ open }: { open: boolean }) {
    useEffect(() => {
      if (!open) {
        // closing: did filters change?
        const changed =
          initialCountyRef.current !== (selectedCounty ?? null) ||
          initialCitiesRef.current !== citiesToParam(selectedCities);

        if (changed) {
          track("filter_applied", {
            type: "location",
            county: selectedCounty ?? null,
            cities: citiesToParam(selectedCities),
            cities_count: selectedCities.length,
            via: closeViaRef.current || "unknown",
          });
        }
        track("location_dropdown_close", {
          via: closeViaRef.current || "unknown",
        });
        // reset reason
        closeViaRef.current = null;
        return;
      }

      // opening: snapshot current state and add listeners
      initialCountyRef.current = selectedCounty ?? null;
      initialCitiesRef.current = citiesToParam(selectedCities);
      track("location_dropdown_open", {
        county: selectedCounty ?? null,
        cities_count: selectedCities.length,
      });

      const onMouseDown = (e: MouseEvent) => {
        const t = e.target as Node;
        if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
        closeViaRef.current = "outside_click";
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") closeViaRef.current = "escape";
      };

      document.addEventListener("mousedown", onMouseDown, true);
      document.addEventListener("keydown", onKey, true);
      return () => {
        document.removeEventListener("mousedown", onMouseDown, true);
        document.removeEventListener("keydown", onKey, true);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    return null;
  }

  return (
    <Popover className="relative w-full max-w-md">
      {({ open }) => (
        <>
          <OpenWatcher open={open} />
          {/* Button */}
          <Popover.Button
            ref={btnRef}
            className="border px-3 pr-9 py-1.5 rounded w-full text-left relative bg-white"
            onClick={() => {
              // If it's currently open, the click will close it
              if (open) closeViaRef.current = "toggle_button";
            }}
          >
            <span className="block truncate">{label}</span>
            <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </Popover.Button>

          {/* Panel */}
          {open && (
            <Popover.Panel
              ref={panelRef}
              className="absolute z-10 mt-2 w-full bg-white border rounded shadow-lg p-4 text-sm space-y-4"
            >
              {/* County Dropdown */}
              <div>
                <label className="block font-medium mb-1">County</label>
                <select
                  value={selectedCounty || ''}
                  onChange={(e) => {
                    const v = e.target.value || null;
                    setSelectedCounty(v);
                    track("county_select", { county: v });
                  }}
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">Any County</option>
                  {allCounties.map((county) => (
                    <option key={county} value={county}>
                      {county}
                    </option>
                  ))}
                </select>
              </div>

              {/* City checkboxes */}
              <div>
                <label className="block font-medium mb-1">City</label>
                {/* Search input */}
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => {
                    const q = e.target.value;
                    setCitySearch(q);
                    // results count *before* render: use current filteredCities length as approximation
                    track("city_search_change", { query: q, results: filteredCities.length });
                  }}
                  placeholder="Search cities..."
                  className="w-full mb-2 px-2 py-1 border rounded text-sm"
                />
                <div className="border rounded p-2 max-h-40 overflow-y-auto">
                  {filteredCities.map((city) => (
                    <div key={city} className="flex items-center mb-1">
                      <input
                        type="checkbox"
                        id={`city-${city}`}
                        checked={Array.isArray(selectedCities) && selectedCities.includes(city)}
                        onChange={() => toggleCity(city)}
                        className="mr-2"
                      />
                      <label htmlFor={`city-${city}`}>{city}</label>
                    </div>
                  ))}
                </div>
              </div>
            </Popover.Panel>
          )}
        </>
      )}
    </Popover>
  );
}
