import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, MapPin, Ticket } from 'lucide-react';

export default function HeroCarousel({ events = [], onSelectEvent }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    if (!events.length || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [events.length, isPaused]);

  if (!events.length) return null;

  const current = events[currentIndex] || events[0];

  const getSlideStyle = (index) => {
    const total = events.length;
    let diff = (index - currentIndex) % total;
    if (diff < -Math.floor(total / 2)) diff += total;
    if (diff > Math.floor(total / 2)) diff -= total;

    if (diff === 0) {
      return {
        transform: 'none',
        zIndex: 10,
        opacity: 1,
        pointerEvents: 'auto',
      };
    } else if (diff === 1) {
      return {
        transform: 'translateX(285px) scale(0.76) rotateY(-18deg)',
        zIndex: 8,
        opacity: 0.95,
        pointerEvents: 'auto',
      };
    } else if (diff === -1) {
      return {
        transform: 'translateX(-285px) scale(0.76) rotateY(18deg)',
        zIndex: 8,
        opacity: 0.95,
        pointerEvents: 'auto',
      };
    } else if (diff === 2) {
      return {
        transform: 'translateX(520px) scale(0.58) rotateY(-32deg)',
        zIndex: 6,
        opacity: 0.82,
        pointerEvents: 'auto',
      };
    } else if (diff === -2) {
      return {
        transform: 'translateX(-520px) scale(0.58) rotateY(32deg)',
        zIndex: 6,
        opacity: 0.82,
        pointerEvents: 'auto',
      };
    } else {
      return {
        transform: `translateX(${diff > 0 ? 650 : -650}px) scale(0.4) rotateY(${diff > 0 ? -45 : 45}deg)`,
        zIndex: 2,
        opacity: 0,
        pointerEvents: 'none',
      };
    }
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % events.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;
    if (deltaX > 50) {
      handlePrev();
    } else if (deltaX < -50) {
      handleNext();
    }
    touchStartX.current = null;
  };

  return (
    <section
      className="relative isolate flex min-h-[580px] w-full flex-col gap-8 overflow-hidden bg-background px-4 pb-10 pt-10 sm:px-6 lg:min-h-0 lg:gap-10 lg:px-0 lg:pb-12 lg:pt-14 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 3D Perspective Coverflow Stage (Exact axess.zone layout) */}
      <div
        className="group/hero relative mx-auto flex w-full max-w-[1262px] items-center justify-center"
        style={{ perspective: '1400px', height: '433px', touchAction: 'pan-y' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrows */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous marquee event"
          className="absolute left-1 sm:left-4 lg:left-8 z-30 flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-full border border-[#494949] bg-black/80 text-white transition-all duration-300 hover:bg-white/10 hover:border-white active:scale-95 shadow-xl"
        >
          <ChevronLeft className="h-5 w-5 lg:h-6 lg:w-6" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next marquee event"
          className="absolute right-1 sm:right-4 lg:right-8 z-30 flex h-10 w-10 lg:h-12 lg:w-12 items-center justify-center rounded-full border border-[#494949] bg-black/80 text-white transition-all duration-300 hover:bg-white/10 hover:border-white active:scale-95 shadow-xl"
        >
          <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6" />
        </button>

        {/* 3D Poster Cards */}
        {events.map((event, idx) => {
          const style = getSlideStyle(idx);
          const isCenter = idx === currentIndex;

          return (
            <div
              key={event.id}
              onClick={() => {
                if (isCenter) {
                  onSelectEvent(event.id);
                } else {
                  setCurrentIndex(idx);
                }
              }}
              className="absolute cursor-pointer select-none overflow-hidden rounded-[12px] border-2 border-white shadow-xl shadow-black/40 w-[330px] h-[413px] bg-[#111111] transition-all duration-700 ease-out"
              style={{
                ...style,
                transformStyle: 'preserve-3d',
              }}
            >
              <img
                src={event.poster_url || event.banner_url}
                alt={event.title}
                draggable={false}
                className="h-full w-full object-cover transition-transform duration-700"
                loading={isCenter ? 'eager' : 'lazy'}
              />
            </div>
          );
        })}
      </div>

      {/* Selected Event Details & Double-Border CTA (Exact axess.zone layout) */}
      <div className="mx-auto flex w-full max-w-[1138px] flex-col items-center gap-4 text-center px-4 mt-1">
        <h2 className="text-[24px] sm:text-[28px] lg:text-[25px] font-normal leading-tight text-white tracking-tight">
          {current.title}
        </h2>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-[18px] w-[18px] shrink-0 text-white" strokeWidth={1.8} />
            <span className="text-base sm:text-lg lg:text-xl font-normal text-white">
              {current.date_display}
            </span>
          </span>
          <span className="inline-flex items-center gap-2">
            <MapPin className="h-[18px] w-[18px] shrink-0 text-white" strokeWidth={1.8} />
            <span className="text-base sm:text-lg lg:text-xl font-normal text-white">
              {current.venue_name || current.location_city}
            </span>
          </span>
        </div>

        {/* Signature Double-Border Offset CTA Button */}
        <button
          type="button"
          onClick={() => onSelectEvent(current.id)}
          aria-label={`Book Tickets for ${current.title}`}
          className="mt-2 inline-block cursor-pointer group active:scale-95 transition-transform"
        >
          <span className="relative block h-[48.72px] w-[158px]">
            {/* Offset white border */}
            <span className="absolute left-[3.76%] top-[17.34%] h-[82.66%] w-[96.24%] border border-white"></span>
            {/* White foreground block */}
            <span className="absolute left-0 top-0 flex h-[39px] w-[152px] items-center justify-center gap-2 bg-white text-black px-2.5 transition-colors group-hover:bg-[#E5E5E5]">
              <Ticket className="h-[18px] w-[18px] text-black shrink-0" />
              <span className="text-[15px] font-medium text-black">Book Tickets</span>
            </span>
          </span>
        </button>

        {/* Slide Indicator Dots */}
        <div className="mt-2 flex items-center gap-2">
          {events.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/35 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}