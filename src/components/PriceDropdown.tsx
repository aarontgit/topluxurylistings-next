"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Portal from "./Portal";

interface PriceDropdownProps {
  minPrice: string;
  maxPrice: string;
  setFilters: (filters: (prev: any) => any) => void;
}

export default function PriceDropdown({ minPrice, maxPrice, setFilters }: PriceDropdownProps) {
  const [open, setOpen] = useState(false);
  const [priceWarning, setPriceWarning] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  const reposition = () => {
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const margin = 8;
    const vw = window.innerWidth;
    const isMobile = vw < 640;

    const mobileWidth = vw - margin * 2;
    const desktopWidth = 240; // ~ w-60

    const width = isMobile ? mobileWidth : desktopWidth;
    const left = isMobile ? margin : clamp(rect.left, margin, vw - width - margin);
    const top = rect.bottom + margin;

    setPanelStyle({ top, left, width });
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onScrollOrResize = () => reposition();

    document.addEventListener("mousedown", onDown);
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    window.addEventListener("scroll", onScrollOrResize, { passive: true });

    reposition();

    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize);
    };
  }, [open]);

  useEffect(() => {
    if (minPrice && maxPrice && Number(maxPrice) < Number(minPrice)) {
      setPriceWarning("Max price should be greater than or equal to min price.");
    } else {
      setPriceWarning("");
    }
  }, [minPrice, maxPrice]);

  const getPriceLabel = () => {
    if (minPrice && maxPrice)
      return `$${Number(minPrice).toLocaleString()} - $${Number(maxPrice).toLocaleString()}`;
    if (minPrice) return `$${Number(minPrice).toLocaleString()}+`;
    if (maxPrice) return `Up to $${Number(maxPrice).toLocaleString()}`;
    return "Price";
  };

  const handleChange = (name: "minPrice" | "maxPrice", value: string) => {
    const raw = value.replace(/[^\d]/g, "");
    setFilters((prev: any) => ({ ...prev, [name]: raw }));
  };

  return (
    <div className="relative w-full sm:w-60">
      {/* CHANGED: relative + pr-9 and absolutely positioned chevron (matches Bed/Bath) */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative border px-3 pr-9 py-1.5 rounded flex items-center bg-white w-full"
      >
        <span className="truncate">{getPriceLabel()}</span>
        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </button>

      {open && (
        <Portal>
          <div
            ref={panelRef}
            className="fixed z-[1000] bg-white shadow-lg border rounded p-4"
            style={{ top: panelStyle.top, left: panelStyle.left, width: panelStyle.width }}
          >
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
        </Portal>
      )}
    </div>
  );
}
