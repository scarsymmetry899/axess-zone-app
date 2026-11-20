import React from 'react';
import { MapPin } from 'lucide-react';

export default function UpNextFeed({ events = [], onSelectEvent, onBookTickets }) {
  return (
    <section id="up-next" className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-[30px] pt-8 pb-14">
      {/* Section Header with Official Axess Line Ornaments */}
      <div className="flex w-full items-center justify-center gap-4 px-4 py-8 sm:gap-6 sm:px-6 lg:gap-[31px] lg:px-[30px] lg:py-10">
        <div className="relative h-[5px] flex-1 max-w-[320px]">
          <img alt="" aria-hidden="true" className="object-fill w-full h-full" src="/Line-2.svg" />
        </div>
        <h2 className="shrink-0 text-center font-heading text-[20px] font-semibold leading-tight text-white sm:text-[24px] lg:text-[30px]">
          Up Next
        </h2>
        <div className="relative h-[5px] flex-1 max-w-[320px]">
          <img alt="" aria-hidden="true" className="object-fill w-full h-full" src="/Line-1.svg" />
        </div>
      </div>

      {/* Grid of Cards matching axess.zone */}
      {events.length === 0 ? (
        <div className="w-full p-12 rounded-[20px] bg-black border border-white/20 text-center flex flex-col items-center justify-center gap-2">
          <p className="font-heading text-white font-semibold">No live events match your filter criteria.</p>
          <p className="text-[12px] text-[#848484]">Try selecting "View All" or resetting your search filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              onClick={() => onSelectEvent(event.id)}
              className="card-glossy relative flex flex-col rounded-[20px] border-[1.5px] border-white/25 bg-black w-full overflow-hidden hover:border-white/50 transition-all duration-300 cursor-pointer group shadow-lg"
            >
              {/* Artwork Banner with Exact axess.zone aspect-[8/3] dimension */}
              <div className="relative w-full aspect-[8/3] overflow-hidden rounded-t-[19px] bg-[#0f0f0f]">
                <img
                  src={event.banner_url || event.poster_url}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
              </div>

              {/* Event Title */}
              <div className="w-full px-5 pt-4">
                <p className="line-clamp-2 min-h-[41px] text-[15px] font-normal leading-snug text-white font-heading">
                  {event.title}
                </p>
              </div>

              {/* Event Details: Date, Venue, Price and Offset Button */}
              <div className="mt-auto flex flex-col gap-4 pb-6 pt-5">
                <div className="flex items-start justify-between px-5">
                  <div className="flex items-start gap-2 text-white">
                    <MapPin className="mt-[2px] shrink-0 text-white/80 w-[18px] h-[18px]" />
                    <div className="text-[14px] leading-snug font-body">
                      <div className="font-normal">{event.date_display}</div>
                      <div className="font-normal text-white/80 truncate max-w-[150px]">{event.venue_name}</div>
                    </div>
                  </div>

                  <div className="text-right text-white max-w-[140px] shrink-0">
                    <div className="text-[11px] font-normal text-white/60 font-body">Ticket Price</div>
                    <div className="text-[14px] font-bold leading-snug mt-0.5 font-heading">
                      ₹{event.price_min?.toLocaleString()}
                      {event.price_max && event.price_max > event.price_min
                        ? ` - ₹${event.price_max.toLocaleString()}`
                        : ''}
                    </div>
                  </div>
                </div>

                {/* Double Border Offset Button matching axess.zone */}
                <div className="flex items-center justify-center pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookTickets(event.id);
                    }}
                    className="relative w-[158px] h-[48.72px] cursor-pointer group/btn"
                  >
                    <div className="absolute w-[96.24%] h-[82.66%] top-[17.34%] left-[3.76%] border border-solid border-white group-hover/btn:translate-x-0.5 group-hover/btn:translate-y-0.5 transition-transform"></div>
                    <div className="flex w-[152px] h-[39px] items-center justify-center gap-2.5 p-2.5 absolute top-0 left-0 bg-white group-hover/btn:bg-[#e0e0e0] transition-colors">
                      <span className="font-heading font-normal text-black text-[15px] whitespace-nowrap">
                        Book tickets
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}