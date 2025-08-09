"use client";

import GoogleMapsLoader from "../../components/GoogleMapsLoader";
import SearchBar from "../../components/SearchBar";
import PriceDropdown from "../../components/PriceDropdown";
import BedBathDropdown from "../../components/BedBathDropdown";
import CountyCityMultiSelect from "../../components/CountyCityMultiSelect";

type Filters = {
  minPrice: string;
  maxPrice: string;
  beds: string;
  baths: string;
  exactBeds: boolean;
  cities: string[];
  county: string | null;
};

export default function FiltersBar({
  searchInput,
  setSearchInput,
  handleSearchFromAutocomplete,
  filters,
  setFilters,
  setCities,
  setCounty,
}: {
  searchInput: string;
  setSearchInput: (val: string) => void;
  handleSearchFromAutocomplete: (
    input: string,
    city?: string,
    county?: string,
    zip?: string
  ) => void;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  setCities: (val: string[] | ((prev: string[]) => string[])) => void;
  setCounty: (
    val: string | ((prev: string | null) => string | null) | null
  ) => void;
}) {
  return (
    <div className="relative z-30 mb-4 flex flex-col sm:flex-row sm:flex-nowrap gap-2 items-end">
      {/* Hide SearchBar on mobile */}
      <div className="w-full lg:w-[500px] flex-shrink-0">
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSearch={handleSearchFromAutocomplete}
          inputClassName="w-[500px] max-w-full px-3 py-2 rounded-md bg-white text-black text-sm border border-gray-300"
        />
      </div>

      <div className="flex flex-wrap sm:flex-nowrap gap-2 items-end flex-1">
        <div className="relative z-30">
          <PriceDropdown
            minPrice={filters.minPrice}
            maxPrice={filters.maxPrice}
            setFilters={setFilters}
          />
        </div>

        <div className="relative z-30">
          <BedBathDropdown filters={filters} setFilters={setFilters} />
        </div>

        <div className="w-[250px] min-w-0 relative z-30">
          <CountyCityMultiSelect
            selectedCities={filters.cities}
            setSelectedCities={setCities}
            selectedCounty={filters.county}
            setSelectedCounty={setCounty}
          />
        </div>
      </div>
    </div>
  );
}
