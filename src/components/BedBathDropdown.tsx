"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Portal from "./Portal";

const bedOptions = [
  { label: "Any Beds", value: "" },
  { label: "Studio+", value: 0 },
  { label: "1+", value: 1 },
  { label: "2+", value: 2 },
  { label: "3+", value: 3 },
  { label: "4+", value: 4 },
  { label: "5+", value: 5 },
];

const bathOptions = [
  { label: "Any Baths", value: "" },
  { label: "1+", value: 1 },
  { label: "1.5+", value: 1.5 },
  { label: "2+", value: 2 },
  { label: "3+", value: 3 },
  { label: "4+", value: 4 },
];

export default function BedBathDropdown({
  filters,
  setFilters,
}: {
  filters: { beds: string; baths: string; exactBeds: boolean };
  setFilters: (cb: (prev: any) => any) => void;
}) {
  const selectedBeds =
    bedOptions.find((o) => o.value.toString() === filters.beds) ?? bedOptions[0];
  const selectedBaths =
    bathOptions.find((o) => o.value.toString() === filters.baths) ?? bathOptions[0];

  const label = `${selectedBeds.label} / ${selectedBaths.label}`;

  const [open, setOpen] = useState(false);
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

    const width = isMobile ? vw - margin * 2 : 320; // ~ min-w-[20rem]
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

  const applyBeds = (val: string) => {
    setFilters((prev: any) => ({ ...prev, beds: val }));
    setOpen(false);
  };
  const applyBaths = (val: string) => {
    setFilters((prev: any) => ({ ...prev, baths: val }));
    setOpen(false);
  };

  return (
    <div className="relative w-full sm:w-60">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative border px-3 pr-9 py-1.5 rounded flex items-center bg-white w-full"
      >
        <span className="truncate">{label}</span>
        {/* absolutely pin chevron to the right */}
        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </button>

      {open && (
        <Portal>
          <div
            ref={panelRef}
            className="fixed z-[1000] bg-white shadow-lg border rounded p-4"
            style={{ top: panelStyle.top, left: panelStyle.left, width: panelStyle.width }}
          >
            {/* Beds row */}
            <div>
              <div className="font-semibold mb-2">Beds</div>
              <div className="flex flex-wrap gap-2">
                {bedOptions.map((option) => (
                  <button
                    key={`beds-${option.value}`}
                    onClick={() => applyBeds(option.value.toString())}
                    className={`px-3 py-1 border rounded text-sm ${
                      filters.beds.toString() === option.value.toString()
                        ? "bg-blue-600 text-white border-blue-600"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <label className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.exactBeds}
                  onChange={(e) =>
                    setFilters((prev: any) => ({ ...prev, exactBeds: e.target.checked }))
                  }
                />
                <span className="text-sm">Exact beds</span>
              </label>
            </div>

            {/* Baths row */}
            <div className="mt-4">
              <div className="font-semibold mb-2">Baths</div>
              <div className="flex flex-wrap gap-2">
                {bathOptions.map((option) => (
                  <button
                    key={`baths-${option.value}`}
                    onClick={() => applyBaths(option.value.toString())}
                    className={`px-3 py-1 border rounded text-sm ${
                      filters.baths.toString() === option.value.toString()
                        ? "bg-blue-600 text-white border-blue-600"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
