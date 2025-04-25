// components/PriceDropdown.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface PriceDropdownProps {
  minPrice: string;
  maxPrice: string;
  setFilters: (filters: (prev: any) => any) => void;
}

export default function PriceDropdown({ minPrice, maxPrice, setFilters }: PriceDropdownProps) {
  const [open, setOpen] = useState(false);
  const [priceWarning, setPriceWarning] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (minPrice && maxPrice && Number(maxPrice) < Number(minPrice)) {
      setPriceWarning("Max price should be greater than or equal to min price.");
    } else {
      setPriceWarning("");
    }
  }, [minPrice, maxPrice]);

  const getPriceLabel = () => {
    if (minPrice && maxPrice) return `$${Number(minPrice).toLocaleString()} - $${Number(maxPrice).toLocaleString()}`;
    if (minPrice) return `$${Number(minPrice).toLocaleString()}+`;
    if (maxPrice) return `Up to $${Number(maxPrice).toLocaleString()}`;
    return "Price";
  };

  const handleChange = (name: "minPrice" | "maxPrice", value: string) => {
    const raw = value.replace(/[^\d]/g, "");
    setFilters((prev: any) => ({ ...prev, [name]: raw }));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="border px-4 py-2 rounded flex items-center gap-2"
      >
        {getPriceLabel()} <ChevronDown className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute z-10 mt-2 bg-white shadow-md border rounded p-4 w-60">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Min Price</label>
            <input
              type="text"
              inputMode="numeric"
              value={minPrice}
              onChange={(e) => handleChange("minPrice", e.target.value)}
              className="w-full border px-3 py-2 rounded"
              placeholder="No Min"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Price</label>
            <input
              type="text"
              inputMode="numeric"
              value={maxPrice}
              onChange={(e) => handleChange("maxPrice", e.target.value)}
              className="w-full border px-3 py-2 rounded"
              placeholder="No Max"
            />
            {priceWarning && (
              <p className="text-red-500 text-sm mt-2">{priceWarning}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
