import React from 'react';
import { Search, X } from 'lucide-react';

export const LOCATIONS = ['Goa', 'Bangalore', 'Kasol'];

export const CATEGORIES = [
  'View All',
  'Festival',
  'Nightlife',
  'Music',
  'Community',
  'Arts & Theatre',
  'Food & Drink',
  'Networking',
  'Technology',
  'Wellness',
  'Workshop',
  'Other'
];

export default function Filters({
  selectedLocation,
  onSelectLocation,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}) {
  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-8 flex flex-col gap-6">
      {/* Mobile Search Bar */}
      <div className="relative w-full lg:hidden">
        <Search className="w-4 h-4 text-[#848484] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search live events, venues, artists..."
          className="w-full h-10 pl-10 pr-9 rounded-[30px] bg-[#111111] border border-[#212121] focus:border-[#444] text-white placeholder-[#848484] text-sm font-body outline-none transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848484] hover:text-white transition-colors p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Filter Strip */}
      <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none py-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat || (cat === 'View All' && !selectedCategory);
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat === 'View All' ? '' : cat)}
              className={`flex items-center h-8 px-4 rounded-[12px] shrink-0 transition-all text-xs font-heading font-medium border active:scale-95 ${
                isActive
                  ? 'bg-white text-black border-white font-semibold shadow-sm'
                  : 'bg-black border-white/20 text-[#848484] hover:text-white hover:border-white/40'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Location Filter Section matching axess.zone */}
      <div className="flex flex-col gap-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[26px] sm:text-[30px] font-heading font-normal text-white">
            Location
          </h2>
          <button
            onClick={() => onSelectLocation('')}
            className={`text-sm sm:text-base font-heading font-medium transition-colors ${
              !selectedLocation ? 'text-white' : 'text-[#848484] hover:text-white'
            }`}
          >
            View All
          </button>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-none py-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {LOCATIONS.map((loc) => {
            const isActive = selectedLocation === loc;
            return (
              <button
                key={loc}
                onClick={() => onSelectLocation(isActive ? '' : loc)}
                className={`min-w-[120px] sm:min-w-[140px] h-[48px] sm:h-[54px] px-6 sm:px-8 rounded-[15px] border flex items-center justify-center text-sm sm:text-base font-heading font-normal transition-all active:scale-95 ${
                  isActive
                    ? 'border-white bg-white text-black font-medium shadow-md'
                    : 'border-white/25 bg-black text-white hover:border-white/60 hover:bg-white/5'
                }`}
              >
                {loc}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}