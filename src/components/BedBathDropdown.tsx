"use client";

import { Listbox } from '@headlessui/react';
import { useState } from 'react';

const bedOptions = [
  { label: 'Any Beds', value: '' },
  { label: 'Studio+', value: 0 },
  { label: '1+', value: 1 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
  { label: '5+', value: 5 },
];

const bathOptions = [
  { label: 'Any Baths', value: '' },
  { label: '1+', value: 1 },
  { label: '1.5+', value: 1.5 },
  { label: '2+', value: 2 },
  { label: '3+', value: 3 },
  { label: '4+', value: 4 },
];

export default function BedBathDropdown({ filters, setFilters }: {
  filters: { beds: string; baths: string; exactBeds: boolean };
  setFilters: (cb: (prev: any) => any) => void;
}) {
  const selectedBeds = bedOptions.find((o) => o.value.toString() === filters.beds) ?? bedOptions[0];
  const selectedBaths = bathOptions.find((o) => o.value.toString() === filters.baths) ?? bathOptions[0];

  const label = `${selectedBeds.label} / ${selectedBaths.label}`;

  return (
    <div className="relative w-60">
      <Listbox value={label} onChange={() => {}}>
        <Listbox.Button className="border px-3 py-2 rounded w-full text-left">
          {label}
        </Listbox.Button>
        <Listbox.Options className="absolute z-10 mt-1 bg-white shadow rounded min-w-[20rem] p-4 space-y-4">

          {/* Beds row */}
          <div>
            <div className="font-semibold mb-2">Beds</div>
            <div className="flex flex-wrap gap-2">
              {bedOptions.map((option) => (
                <Listbox.Option
                  key={`beds-${option.value}`}
                  value={option.value}
                  onClick={() =>
                    setFilters((prev: any) => ({
                      ...prev,
                      beds: option.value.toString(),
                    }))
                  }
                  className="cursor-pointer px-3 py-1 border rounded hover:bg-gray-100 text-sm"
                >
                  {option.label}
                </Listbox.Option>
              ))}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="exactBeds"
                checked={filters.exactBeds}
                onChange={(e) =>
                  setFilters((prev: any) => ({
                    ...prev,
                    exactBeds: e.target.checked,
                  }))
                }
              />
              <label htmlFor="exactBeds" className="text-sm">Exact beds</label>
            </div>
          </div>

          {/* Baths row */}
          <div>
            <div className="font-semibold mb-2">Baths</div>
            <div className="flex flex-wrap gap-2">
              {bathOptions.map((option) => (
                <Listbox.Option
                  key={`baths-${option.value}`}
                  value={option.value}
                  onClick={() =>
                    setFilters((prev: any) => ({
                      ...prev,
                      baths: option.value.toString(),
                    }))
                  }
                  className="cursor-pointer px-3 py-1 border rounded hover:bg-gray-100 text-sm"
                >
                  {option.label}
                </Listbox.Option>
              ))}
            </div>
          </div>

        </Listbox.Options>
      </Listbox>
    </div>
  );
}
