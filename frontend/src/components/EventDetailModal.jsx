import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useSocket } from '../context/SocketContext.jsx';
import LeafletMap from './LeafletMap.jsx';
import { X, Calendar, MapPin, Check, Plus, Minus, ArrowRight, Clock } from 'lucide-react';

export default function EventDetailModal({
  eventId,
  onClose,
  onProceedToCheckout,
}) {
  const { subscribeToEvent, unsubscribeFromEvent, socket } = useSocket();
  const [eventData, setEventData] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [organizer, setOrganizer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected tier & quantity
  const [selectedTierId, setSelectedTierId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    setLoading(true);
    subscribeToEvent(eventId);

    api.getEventDetail(eventId)
      .then((res) => {
        setEventData(res.event);
        setTiers(res.tiers || []);
        setOrganizer(res.organizer);

        // Pre-select first available tier
        const firstAvailable = res.tiers?.find((t) => t.sale_state === 'Available Now');
        if (firstAvailable) {
          setSelectedTierId(firstAvailable.id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    // Listen for live tier updates on this specific event
    const handleTierUpdate = (data) => {
      if (data.eventId === eventId && data.tier) {
        const rawPerks = data.tier.perks;
        let parsedPerks = [];
        try {
          parsedPerks = Array.isArray(rawPerks)
            ? rawPerks
            : (typeof rawPerks === 'string' ? JSON.parse(rawPerks || '[]') : []);
        } catch {
          parsedPerks = [];
        }
        const incomingTier = { ...data.tier, perks: parsedPerks };
        setTiers((prev) =>
          prev.map((t) => (t.id === incomingTier.id ? { ...t, ...incomingTier } : t))
        );
      }
    };

    if (socket) {
      socket.on(`event:${eventId}:tiers:update`, handleTierUpdate);
    }

    return () => {
      unsubscribeFromEvent(eventId);
      if (socket) {
        socket.off(`event:${eventId}:tiers:update`, handleTierUpdate);
      }
    };
  }, [eventId, socket]);

  if (!eventId) return null;

  const selectedTier = tiers.find((t) => t.id === selectedTierId);
  const subtotal = selectedTier ? selectedTier.price * quantity : 0;

  const handleStartHoldReservation = async () => {
    if (!selectedTier || selectedTier.sale_state !== 'Available Now') return;

    setReserving(true);
    try {
      // 1. Create temporary 10 min reservation hold on backend
      const holdRes = await api.createHold(selectedTier.id, quantity);
      // 2. Open Checkout modal passing hold details
      onProceedToCheckout({
        holdToken: holdRes.holdToken,
        tier: selectedTier,
        quantity,
        event: eventData,
        expiresAt: holdRes.expiresAt,
        ttlSeconds: holdRes.ttlSeconds,
        subtotal
      });
    } catch (err) {
      alert(`Could not reserve tickets: ${err.message}`);
    } finally {
      setReserving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#111111] border border-[#212121] rounded-[20px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="h-14 px-5 border-b border-[#212121] flex items-center justify-between shrink-0 bg-[#111111]">
          <div className="flex items-center gap-2">
            <span className="font-heading text-[13px] font-semibold tracking-wider text-[#848484] uppercase">
              Event Intelligence
            </span>
            <span className="w-1 h-1 rounded-full bg-white"></span>
            <span className="text-[11px] text-[#606060] font-mono">Real-Time Sync Active</span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-[#1c1c1c] border border-[#2e2e2e] hover:border-white/40 text-[#848484] hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-[#848484]">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[12px] font-mono">Retrieving tier allocations & coordinates...</p>
          </div>
        ) : error || !eventData ? (
          <div className="p-12 text-center text-white">
            <p className="font-semibold text-red-400">Failed to load event details.</p>
            <p className="text-[12px] text-[#848484] mt-1">{error}</p>
          </div>
        ) : (
          <div className="overflow-y-auto p-5 sm:p-6 flex flex-col gap-6">
            {/* Banner & Header */}
            <div className="relative w-full h-56 sm:h-72 rounded-[12px] overflow-hidden bg-black border border-[#212121]">
              <img src={eventData.banner_url || eventData.poster_url} alt={eventData.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/40 to-transparent"></div>

              <div className="absolute bottom-4 left-4 right-4 flex flex-col">
                <span className="px-2.5 py-0.5 rounded-[12px] bg-black/80 border border-white/20 text-[#ccc] text-[10px] font-mono self-start mb-2">
                  {eventData.category} • {eventData.location_city}
                </span>
                <h2 className="font-heading text-[22px] sm:text-[28px] font-semibold text-white tracking-tight leading-tight">
                  {eventData.title}
                </h2>
                {eventData.subtitle && (
                  <p className="text-[12px] sm:text-[13px] text-[#848484] font-body mt-0.5">
                    {eventData.subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Event Overview: Date, Venue, Organizer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-[12px] bg-[#161616] border border-[#212121]">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-[#848484] shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-mono text-[#606060]">Date & Schedule</p>
                  <p className="font-heading text-[13px] font-semibold text-white">{eventData.date_display}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#848484] shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] uppercase font-mono text-[#606060]">Venue</p>
                  <p className="font-heading text-[13px] font-semibold text-white truncate">{eventData.venue_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#848484] shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] uppercase font-mono text-[#606060]">Organizer</p>
                  <p className="font-heading text-[13px] font-semibold text-white truncate">{organizer?.name || 'Axess Certified'}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <h3 className="font-heading text-[16px] font-semibold text-white tracking-tight">About The Gathering</h3>
              <p className="text-[13px] sm:text-[14px] text-[#848484] font-body leading-relaxed whitespace-pre-line">
                {eventData.description}
              </p>
            </div>

            {/* Interactive OpenStreetMap / Leaflet Venue Map */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-[16px] font-semibold text-white tracking-tight">Venue Geography</h3>
                <span className="text-[11px] text-[#606060] font-mono">{eventData.venue_address}</span>
              </div>
              <LeafletMap
                lat={eventData.lat}
                lng={eventData.lng}
                venueName={eventData.venue_name}
                venueAddress={eventData.venue_address}
                height="220px"
              />
            </div>

            {/* Multi-Tier Ticket Matrix */}
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading text-[17px] font-semibold text-white tracking-tight">Select Pass Tier</h3>
                  <p className="text-[12px] text-[#848484] font-body">10-minute hold reservation prevents overselling</p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {tiers.map((tier) => {
                  const isClosed = tier.sale_state === 'Tier Closed' || tier.sale_state === 'Sold Out';
                  const isSelected = selectedTierId === tier.id;

                  return (
                    <div
                      key={tier.id}
                      onClick={() => !isClosed && setSelectedTierId(tier.id)}
                      className={`p-4 rounded-[12px] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isClosed
                          ? 'bg-[#141414]/60 border-[#212121]/60 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#1a1a1a] border-white ring-1 ring-white/50 cursor-pointer shadow-lg'
                          : 'bg-[#161616] border-[#212121] hover:border-[#383838] cursor-pointer'
                      }`}
                    >
                      {/* Left: Tier Name, Description & Perks */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading text-[15px] font-semibold text-white">{tier.name}</h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-[12px] text-[10px] font-mono uppercase ${
                              tier.sale_state === 'Available Now'
                                ? 'bg-white text-black font-medium'
                                : 'bg-[#1c1c1c] border border-[#2e2e2e] text-[#848484]'
                            }`}
                          >
                            {tier.sale_state}
                          </span>
                        </div>

                        {tier.description && (
                          <p className="text-[12px] text-[#848484] font-body mt-1">{tier.description}</p>
                        )}

                        {(() => {
                          let safePerks = [];
                          try {
                            safePerks = Array.isArray(tier.perks)
                              ? tier.perks
                              : (typeof tier.perks === 'string' ? JSON.parse(tier.perks || '[]') : []);
                          } catch {
                            safePerks = [];
                          }
                          return safePerks.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {safePerks.map((perk, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 text-[10px] text-[#848484] bg-[#111111] border border-[#212121] px-2 py-0.5 rounded-[6px] font-mono"
                                >
                                  <Check className="w-3 h-3 text-white" />
                                  <span>{perk}</span>
                                </span>
                              ))}
                            </div>
                          ) : null;
                        })()}
                      </div>

                      {/* Right: Price */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[#212121] shrink-0">
                        <span className="font-heading text-[18px] font-semibold text-white">
                          ₹{tier.price.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-[#606060] font-mono">per pass</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector and Checkout Bar */}
            {selectedTier && selectedTier.sale_state === 'Available Now' && (
              <div className="p-4 rounded-[12px] bg-[#161616] border border-[#212121] flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#606060]">Tier</span>
                    <p className="font-heading text-[14px] font-semibold text-white">{selectedTier.name}</p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-3 bg-[#111111] border border-[#212121] px-2 py-1 rounded-[20px]">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[#848484] hover:text-white disabled:opacity-30 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-heading font-semibold text-[14px] text-white min-w-[20px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(selectedTier.max_per_order || 6, q + 1))}
                      disabled={quantity >= (selectedTier.max_per_order || 6)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[#848484] hover:text-white disabled:opacity-30 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtotal & Reserve CTA matching Axess button styling */}
                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono text-[#606060]">Subtotal</span>
                    <p className="font-heading text-[18px] font-semibold text-white">
                      ₹{subtotal.toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={handleStartHoldReservation}
                    disabled={reserving}
                    className="h-9 px-5 rounded-[24px] bg-white text-black font-heading text-[13px] font-medium hover:bg-[#e0e0e0] active:scale-95 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <span>{reserving ? 'Reserving...' : 'Reserve & Checkout'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}