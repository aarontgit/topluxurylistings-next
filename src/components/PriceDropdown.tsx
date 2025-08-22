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

  // --- GA helper ---
  const track = (name: string, params?: Record<string, any>) =>
    (window as any)?.gtag?.("event", name, params || {});
  const toNum = (v: string) => {
    if (!v) return null;
    const n = Number(String(v).replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? n : null;
  };

  // remember values when panel opens to detect "apply on close"
  const initialMinRef = useRef<string>("");
  const initialMaxRef = useRef<string>("");

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

  // outside click / resize / scroll handlers when OPEN
  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || btnRef.current?.contains(t)) return;

      // closing via outside click
      const changed =
        initialMinRef.current !== minPrice || initialMaxRef.current !== maxPrice;
      if (changed) {
        track("filter_applied", {
          type: "price",
          min: toNum(minPrice),
          max: toNum(maxPrice),
          via: "outside_click",
        });
      }
      track("price_dropdown_close", { via: "outside_click" });
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
  }, [open, minPrice, maxPrice]);

  // validate range + track transitions into/out of invalid state
  const wasInvalidRef = useRef(false);
  useEffect(() => {
    const minN = toNum(minPrice);
    const maxN = toNum(maxPrice);
    const isInvalid = minN != null && maxN != null && maxN < minN;

    if (isInvalid && !wasInvalidRef.current) {
      track("price_invalid_range", { min: minN, max: maxN });
    }
    if (!isInvalid && wasInvalidRef.current) {
      track("price_invalid_range_resolved", { min: minN, max: maxN });
    }
    wasInvalidRef.current = isInvalid;

    if (isInvalid) {
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
    track("price_input_change", { field: name, value: raw ? Number(raw) : null });
  };

  return (
    <div className="relative w-full sm:w-60">
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (next) {
              // opening via button
              initialMinRef.current = minPrice;
              initialMaxRef.current = maxPrice;
              track("price_dropdown_open", { min: toNum(minPrice), max: toNum(maxPrice), via: "button" });
            } else {
              // closing via button, fire apply if changed
              const changed =
                initialMinRef.current !== minPrice || initialMaxRef.current !== maxPrice;
              if (changed) {
                track("filter_applied", {
                  type: "price",
                  min: toNum(minPrice),
                  max: toNum(maxPrice),
                  via: "toggle_button",
                });
              }
              track("price_dropdown_close", { via: "toggle_button" });
            }
            return next;
          });
        }}
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
              {priceWarning && <p className="text-red-500 text-sm mt-2">{priceWarning}</p>}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
