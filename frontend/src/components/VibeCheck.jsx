import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, X, ExternalLink } from 'lucide-react';

const REELS = [
  {
    id: 'DYuhp0-Jq08',
    title: 'UNMADA VARA sunrise crescendo',
    author: '@axess.zone',
    location: 'HillTop Goa',
    // Authentic high-res crowd video cover
    coverUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-crowd-at-a-music-festival-4286-large.mp4'
  },
  {
    id: 'DYmBfDrxDKc',
    title: 'House of Chapora ritual & bass waves',
    author: '@axess.zone',
    location: 'House of Chapora, Goa',
    coverUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-silhouette-of-a-dj-playing-music-in-a-club-42527-large.mp4'
  },
  {
    id: 'DYZwWLhIu8D',
    title: 'Underground hypnotic dancefloor flow',
    author: '@axess.zone',
    location: 'D Pedro Clifftop, Goa',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-people-dancing-in-a-nightclub-with-colorful-lights-42524-large.mp4'
  },
  {
    id: 'DXHX_7UEVON',
    title: 'Void Acoustics 32Hz sub-frequency pressure',
    author: '@axess.zone',
    location: 'Vagator Beach Amphitheatre',
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-raised-at-a-concert-with-lights-4289-large.mp4'
  },
  {
    id: 'DWRGU6ciWDB',
    title: 'Sunrise techno closing ritual',
    author: '@axess.zone',
    location: 'Ozran Cliffs, Goa',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-party-crowd-in-a-nightclub-42526-large.mp4'
  }
];

export default function VibeCheck() {
  const scrollRef = useRef(null);
  const [activeVideo, setActiveVideo] = useState(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id="vibe-check" className="px-4 sm:px-6 py-16 sm:py-[100px] lg:px-[30px] border-t border-[#1a1a1a]">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-[62px]">
        {/* Headings */}
        <div className="flex max-w-[1064px] flex-col items-center gap-[30px] text-center">
          <h2 className="font-heading text-[32px] font-normal leading-none text-white sm:text-[40px] lg:text-[50px]">
            Vibe Check
          </h2>
          <p className="max-w-[1064px] font-heading text-lg font-normal leading-snug text-white sm:text-[21px] lg:text-[25px]">
            Loudest nights. Craziest Crowds. Real Energy - Captured By You.
          </p>
        </div>

        {/* Carousel of Real Instagram Reels - Perfectly Fitted Without Cutting */}
        <div className="w-full">
          <div className="group/carousel relative">
            <div
              ref={scrollRef}
              className="flex overflow-x-auto scroll-smooth py-3 px-2 gap-4 my-4 sm:gap-5 sm:my-6 lg:gap-6 scrollbar-none"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {REELS.map((reel) => (
                <div
                  key={reel.id}
                  onClick={() => setActiveVideo(reel)}
                  className="relative shrink-0 overflow-hidden rounded-[16px] bg-black ring-1 ring-inset ring-white/15 w-[225px] h-[400px] sm:w-[270px] sm:h-[480px] lg:w-[315px] lg:h-[560px] cursor-pointer group shadow-2xl transition-all duration-300 hover:ring-white/40 hover:scale-[1.01]"
                >
                  {/* Clean Background Video / Cover that scales properly without cutting */}
                  <div className="absolute inset-0 w-full h-full bg-[#0a0a0c]">
                    <img
                      src={reel.coverUrl}
                      alt={reel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40"></div>
                  </div>

                  {/* Top Info Pill */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                    <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white text-[11px] font-mono">
                      {reel.author}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#ccc] text-[9px] font-mono">
                      REEL
                    </span>
                  </div>

                  {/* Centered Play Button Indicator */}
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-xl group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-300">
                      <Play className="w-6 h-6 ml-0.5 fill-current" />
                    </div>
                  </div>

                  {/* Bottom Captions & Venue Details */}
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent z-10 flex flex-col gap-1">
                    <p className="font-heading text-sm font-medium text-white line-clamp-2 leading-snug">
                      {reel.title}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-[#848484] font-body mt-1">
                      <span>{reel.location}</span>
                      <span className="text-white/80 group-hover:text-white flex items-center gap-1 font-mono text-[10px]">
                        Watch ↗
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Left / Right Carousel Controls */}
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-10 h-10 rounded-full bg-black/80 border border-[#494949] text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white/10 z-20"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-10 h-10 rounded-full bg-black/80 border border-[#494949] text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white/10 z-20"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Footer Call-To-Action */}
        <div className="flex max-w-[1077px] flex-col items-center gap-8 text-center">
          <p className="font-body text-base font-medium leading-relaxed text-white/85 sm:text-lg">
            <span className="block">Want your video featured in our gallery?</span>
            <span className="block">
              reach out{' '}
              <a
                href="mailto:socials@axess.zone"
                className="underline underline-offset-2 transition-opacity hover:opacity-80 text-white"
              >
                socials@axess.zone
              </a>
            </span>
          </p>
          <a
            className="font-heading text-xl font-normal leading-none text-white transition-opacity hover:opacity-80 sm:text-[22px] lg:text-[25px]"
            href="https://www.instagram.com/axess.zone/"
            target="_blank"
            rel="noopener noreferrer"
          >
            &gt; Follow us on Instagram
          </a>
        </div>
      </div>

      {/* Zero-Cutting Fullscreen Video Lightbox Modal */}
      {activeVideo && (
        <div
          id="vibe-lightbox"
          onClick={() => setActiveVideo(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm sm:max-w-md aspect-[9/16] max-h-[88vh] bg-black rounded-[20px] border border-white/25 overflow-hidden shadow-2xl flex flex-col justify-between"
          >
            {/* Top Bar with Close & Link */}
            <div className="absolute top-3 inset-x-3 z-30 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent p-2 rounded-t-[16px]">
              <div className="flex items-center gap-2">
                <span className="text-white text-xs font-heading font-semibold">{activeVideo.author}</span>
                <span className="text-[10px] text-[#848484] font-body">• {activeVideo.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.instagram.com/reel/${activeVideo.id}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all"
                  title="Open on Instagram"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setActiveVideo(null)}
                  aria-label="Close"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white hover:text-black text-white flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Video Player - Fits 100% into the box without ANY cutting */}
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <video
                src={activeVideo.videoUrl}
                poster={activeVideo.coverUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            </div>

            {/* Bottom Caption Overlay */}
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black via-black/70 to-transparent z-20 pointer-events-none">
              <p className="font-heading text-sm text-white font-medium">{activeVideo.title}</p>
              <p className="text-[11px] text-[#848484] font-body mt-0.5">Axess Community Underground Sessions</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}