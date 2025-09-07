"use client";

import { useState, useRef, useEffect, useMemo } from "react";
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
  const formatUSD = (n: number | null) =>
    n == null ? "" : n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });

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
    const desktopWidth = 320; // widened a bit for slider
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

  // ------- Slider setup -------
  const DEFAULT_MIN = 0;
  const DEFAULT_MAX = 5_000_000;
  const STEP = 25_000;

  const minN = toNum(minPrice);
  const maxN = toNum(maxPrice);

  const sliderMin = DEFAULT_MIN;
  const sliderMax = useMemo(
    () => Math.max(DEFAULT_MAX, minN ?? DEFAULT_MIN, maxN ?? DEFAULT_MIN),
    [minN, maxN]
  );

  const minHandle = clamp(minN ?? sliderMin, sliderMin, sliderMax);
  const maxHandle = clamp(maxN ?? sliderMax, sliderMin, sliderMax);

  const onMinSlider = (val: number) => {
    setFilters((prev: any) => {
      const curMax = toNum(prev.maxPrice) ?? sliderMax;
      const nextMin = val;
      const nextMax = curMax < val ? val : curMax;
      track("price_slider_change", { handle: "min", value: nextMin, max: nextMax });
      return { ...prev, minPrice: String(nextMin), maxPrice: String(nextMax) };
    });
  };

  const onMaxSlider = (val: number) => {
    setFilters((prev: any) => {
      const curMin = toNum(prev.minPrice) ?? sliderMin;
      const nextMax = val;
      const nextMin = curMin > val ? val : curMin;
      track("price_slider_change", { handle: "max", value: nextMax, min: nextMin });
      return { ...prev, maxPrice: String(nextMax), minPrice: String(nextMin) };
    });
  };
  // ------------------------------------

  return (
    <div className="relative w-full sm:w-60">
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (next) {
              initialMinRef.current = minPrice;
              initialMaxRef.current = maxPrice;
              track("price_dropdown_open", { min: toNum(minPrice), max: toNum(maxPrice), via: "button" });
            } else {
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
            {/* ===== Dual slider ===== */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
                <span>{formatUSD(minN ?? minHandle)}</span>
                <span>{formatUSD(maxN ?? maxHandle)}</span>
              </div>

              <div className="relative h-8">
                {/* Track (visual) */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded bg-gray-200" />
                {/* Selected range (visual) */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-1.5 bg-blue-600 rounded"
                  style={{
                    left: `${((minHandle - sliderMin) / (sliderMax - sliderMin)) * 100}%`,
                    right: `${(1 - (maxHandle - sliderMin) / (sliderMax - sliderMin)) * 100}%`,
                  }}
                />
                {/* Min thumb */}
                <input
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step={STEP}
                  value={minHandle}
                  onChange={(e) => onMinSlider(Number(e.target.value))}
                  className="absolute left-0 right-0 top-0 bottom-0 w-full appearance-none bg-transparent pointer-events-auto"
                  style={{ WebkitAppearance: "none" as any }}
                />
                {/* Max thumb */}
                <input
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step={STEP}
                  value={maxHandle}
                  onChange={(e) => onMaxSlider(Number(e.target.value))}
                  className="absolute left-0 right-0 top-0 bottom-0 w-full appearance-none bg-transparent pointer-events-auto"
                  style={{ WebkitAppearance: "none" as any }}
                />
              </div>

              {/* Thumb + track styles — ONLY CHANGE: margin-top from -6px to -3px */}
              <style jsx>{`
                input[type="range"]::-webkit-slider-runnable-track { height: 6px; }
                input[type="range"]::-moz-range-track { height: 6px; }
                input[type="range"] { height: 18px; }

                input[type="range"]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 18px;
                  height: 18px;
                  border-radius: 9999px;
                  background: white;
                  border: 2px solid #2563eb; /* blue-600 */
                  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                  margin-top: 0px; /* ↓ lowered to center visually */
                }
                input[type="range"]::-moz-range-thumb {
                  width: 18px;
                  height: 18px;
                  border-radius: 9999px;
                  background: white;
                  border: 2px solid #2563eb;
                  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
                }
                input[type="range"] { outline: none; }
              `}</style>
            </div>
            {/* ===== End slider ===== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
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
              </div>
            </div>

            {priceWarning && <p className="text-red-500 text-sm mt-2">{priceWarning}</p>}
          </div>
        </Portal>
      )}
    </div>
  );
}
