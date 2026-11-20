import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, MapPin } from 'lucide-react';

export default function PastGigs({ pastEvents = [], onSelectEvent }) {
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id="past-gigs" className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-6 pb-12">
      {/* Section Header with Official Axess Line Ornaments */}
      <div className="flex w-full items-center justify-center gap-4 px-4 py-8 sm:gap-6 sm:px-6 lg:gap-[31px] lg:px-[30px] lg:py-10">
        <div className="relative h-[5px] flex-1 max-w-[320px]">
          <img alt="" aria-hidden="true" className="object-fill w-full h-full" src="/Line-2.svg" />
        </div>
        <h2 className="shrink-0 text-center font-heading text-[20px] font-semibold leading-tight text-white sm:text-[24px] lg:text-[30px]">
          Past Gigs
        </h2>
        <div className="relative h-[5px] flex-1 max-w-[320px]">
          <img alt="" aria-hidden="true" className="object-fill w-full h-full" src="/Line-1.svg" />
        </div>
      </div>

      {/* Carousel / Scrollable Grid Container */}
      <div className="group/carousel relative">
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scroll-smooth py-2 scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {pastEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => onSelectEvent(event.id)}
              className="min-w-[280px] sm:min-w-[320px] max-w-[340px] shrink-0 card-glossy relative flex flex-col rounded-[20px] border-[1.5px] border-white/25 bg-black overflow-hidden hover:border-white/50 transition-all duration-300 cursor-pointer group shadow-lg"
            >
              {/* Artwork Banner with Exact axess.zone aspect-[8/3] dimension */}
              <div className="relative w-full aspect-[8/3] overflow-hidden rounded-t-[19px] bg-[#0f0f0f] grayscale group-hover:grayscale-0 transition-all duration-500">
                <img
                  src={event.banner_url || event.poster_url}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-[10px] bg-black/80 backdrop-blur-md border border-white/20 text-[#ccc] text-[9px] font-mono uppercase tracking-wider">
                  Concluded
                </div>
              </div>

              {/* Event Content */}
              <div className="w-full px-5 pt-4">
                <p className="line-clamp-2 min-h-[41px] text-[15px] font-normal leading-snug text-white font-heading">
                  {event.title}
                </p>
              </div>

              {/* Date & Venue */}
              <div className="mt-auto px-5 pb-5 pt-3 flex items-start gap-2 text-white">
                <MapPin className="mt-[2px] shrink-0 text-white/80 w-[16px] h-[16px]" />
                <div className="text-[13px] leading-snug font-body">
                  <div className="font-normal text-white/90">
                    {event.date_display.includes('|')
                      ? event.date_display.split('|')[0].trim()
                      : event.date_display}
                  </div>
                  <div className="font-normal text-white/60 truncate max-w-[220px]">
                    {event.date_display.includes('|')
                      ? event.date_display.split('|')[1].trim()
                      : event.venue_name}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Scroll Arrows */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-10 h-10 rounded-full bg-black/80 border border-[#494949] text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white/10 z-10"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-10 h-10 rounded-full bg-black/80 border border-[#494949] text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white/10 z-10"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Centered "View All" Button matching axess.zone */}
      <div className="flex justify-center mt-8">
        <button
          onClick={() => setArchiveModalOpen(true)}
          className="h-10 px-8 rounded-full border border-white/40 bg-black hover:border-white text-white font-heading text-[14px] font-medium transition-all hover:bg-white/5 active:scale-95"
        >
          View All
        </button>
      </div>

      {/* Archive Modal for Viewing All Concluded Gigs */}
      {archiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl max-h-[85vh] bg-[#111111] border border-[#212121] rounded-[20px] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[#212121] flex items-center justify-between">
              <div>
                <h3 className="font-heading text-[20px] font-semibold text-white">Full Past Gigs Archive</h3>
                <p className="text-[12px] text-[#848484] font-body">
                  Concluded underground gatherings, club showcases, and festival editions
                </p>
              </div>
              <button
                onClick={() => setArchiveModalOpen(false)}
                aria-label="Close"
                className="w-9 h-9 rounded-full bg-[#1c1c1c] border border-[#2e2e2e] hover:border-white/40 text-[#848484] hover:text-white flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[calc(85vh-90px)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {pastEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => {
                    setArchiveModalOpen(false);
                    onSelectEvent(event.id);
                  }}
                  className="card-glossy rounded-[20px] border border-white/20 bg-black overflow-hidden p-0 flex flex-col cursor-pointer group"
                >
                  <div className="relative w-full aspect-[8/3] overflow-hidden rounded-t-[19px] bg-[#0f0f0f] grayscale group-hover:grayscale-0 transition-all">
                    <img
                      src={event.banner_url || event.poster_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-[10px] bg-black/80 text-[9px] font-mono text-[#aaa]">
                      Concluded
                    </div>
                  </div>
                  <div className="p-4 flex flex-col justify-between flex-1">
                    <h5 className="font-heading text-[14px] font-semibold text-white truncate">{event.title}</h5>
                    <p className="text-[12px] text-[#848484] mt-1 truncate font-body">
                      {event.date_display.includes('|') ? event.date_display : `${event.date_display} | ${event.venue_name}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}