'use client';

import { Popover } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { useEffect, useState } from 'react';
import countyCityMap from '../data/countyCityMap.json';

interface CountyCityMultiSelectProps {
  selectedCities: string[];
  setSelectedCities: React.Dispatch<React.SetStateAction<string[]>>;
  selectedCounty: string | null;
  setSelectedCounty: React.Dispatch<React.SetStateAction<string | null>>;
  
}

// Type guard since imported JSON has no types
const typedCountyCityMap: Record<string, string[]> = countyCityMap as Record<string, string[]>;

const allCounties = Object.keys(typedCountyCityMap);
const allCities = Array.from(
  new Set(
    Object.values(typedCountyCityMap)
      .flat()
      .filter(city => city.length > 1 && !/\d/.test(city))
  )
).sort();




export default function CountyCityMultiSelect({
  selectedCities,
  setSelectedCities,
  selectedCounty,
  setSelectedCounty,
}: CountyCityMultiSelectProps) {
  const [filteredCities, setFilteredCities] = useState<string[]>(allCities);
  const [citySearch, setCitySearch] = useState('');

  useEffect(() => {
    const allRelevantCities = selectedCounty && typedCountyCityMap[selectedCounty]
      ? typedCountyCityMap[selectedCounty]
      : allCities;
  
    const filtered = allRelevantCities
      .filter(city => city.toLowerCase().includes(citySearch.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));
  
    setFilteredCities(filtered);
  }, [selectedCounty, citySearch]);

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const label = `${selectedCounty || 'Any County'} / ${
    Array.isArray(selectedCities) && selectedCities.length > 0
      ? selectedCities.join(', ')
      : 'Any City'
  }`;
  

  return (
    <Popover className="relative w-full max-w-md">
    <Popover.Button className="border px-3 py-2 rounded w-full text-left relative">
      <span className="block truncate">{label}</span>
      <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
    </Popover.Button>

      <Popover.Panel className="absolute z-10 mt-2 w-full bg-white border rounded shadow-lg p-4 text-sm space-y-4">
        {/* County Dropdown */}
        <div>
          <label className="block font-medium mb-1">County</label>
          <select
            value={selectedCounty || ''}
            onChange={(e) => setSelectedCounty(e.target.value || null)}
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
            onChange={(e) => setCitySearch(e.target.value)}
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
    </Popover>
  );
}
