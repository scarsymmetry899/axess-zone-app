import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import LeafletMap from './LeafletMap.jsx';
import {
  X,
  Calendar,
  MapPin,
  Check,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Edit3,
  Clock,
  ChevronDown,
  ChevronUp,
  ShoppingBag
} from 'lucide-react';

export default function EventDetailModal({
  eventId,
  onClose,
  onProceedToCheckout,
  onOpenAdmin,
}) {
  const { user, role } = useAuth();
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
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [addedToCartToast, setAddedToCartToast] = useState(null);

  // Master Owner inline edit state
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLat, setEditLat] = useState(15.395);
  const [editLng, setEditLng] = useState(73.8115);
  const [savingEdit, setSavingEdit] = useState(false);

  const isMasterOwner = role === 'ADMIN';

  useEffect(() => {
    if (!eventId) return;

    setLoading(true);
    subscribeToEvent(eventId);

    api.getEventDetail(eventId)
      .then((res) => {
        setEventData(res.event);
        setTiers(res.tiers || []);
        setOrganizer(res.organizer);

        setEditTitle(res.event?.title || '');
        setEditDate(res.event?.date_display || '');
        setEditVenue(res.event?.venue_name || '');
        setEditAddress(res.event?.venue_address || '');
        setEditLat(res.event?.lat || 15.395);
        setEditLng(res.event?.lng || 73.8115);

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

  const handleStartHoldReservation = async (tierToBook) => {
    const tier = tierToBook || selectedTier;
    if (!tier || tier.sale_state !== 'Available Now') return;

    setReserving(true);
    try {
      // 1. Create temporary 10 min reservation hold
      const holdRes = await api.createHold(tier.id, quantity);
      // 2. Open Checkout modal passing hold details
      onProceedToCheckout({
        holdToken: holdRes.holdToken,
        tier,
        quantity,
        event: eventData,
        expiresAt: holdRes.expiresAt,
        ttlSeconds: holdRes.ttlSeconds,
        subtotal: tier.price * quantity
      });
    } catch (err) {
      alert(`Could not reserve tickets: ${err.message}`);
    } finally {
      setReserving(false);
    }
  };

  const handleAddToCart = (tier) => {
    setSelectedTierId(tier.id);
    setAddedToCartToast(`${tier.name} added to cart`);
    setTimeout(() => setAddedToCartToast(null), 3000);
  };

  // Master Owner tier status toggle
  const handleToggleTierStatus = async (tierId, currentStatus) => {
    const nextStatus = currentStatus === 'Available Now' ? 'Tier Closed' : 'Available Now';
    try {
      await api.updateTierStatus(tierId, nextStatus);
      setTiers((prev) =>
        prev.map((t) => (t.id === tierId ? { ...t, sale_state: nextStatus } : t))
      );
    } catch (err) {
      alert(`Failed to update tier status: ${err.message}`);
    }
  };

  // Master Owner event update
  const handleSaveEventEdits = async () => {
    setSavingEdit(true);
    try {
      const res = await api.updateEvent(eventData.id, {
        title: editTitle,
        date_display: editDate,
        venue_name: editVenue,
        venue_address: editAddress,
        lat: parseFloat(editLat),
        lng: parseFloat(editLng)
      });
      setEventData(res.event);
      setIsEditingEvent(false);
    } catch (err) {
      alert(`Failed to save edits: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[94vh] bg-[#0A0A0C] border border-[#212121] rounded-[24px] shadow-2xl overflow-hidden flex flex-col">
        {/* Top Control Bar */}
        <div className="h-14 px-6 border-b border-[#212121] flex items-center justify-between shrink-0 bg-[#0A0A0C]">
          <div className="flex items-center gap-3">
            <span className="font-heading text-[13px] font-semibold tracking-wider text-[#A1A1AA] uppercase">
              Event Details
            </span>
            {isMasterOwner && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#201736] border border-[#44336B] text-[11px] font-mono text-[#D8B4FE] font-medium">
                <ShieldCheck className="w-3 h-3 text-[#C084FC]" />
                Master Owner Mode
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isMasterOwner && (
              <button
                onClick={() => setIsEditingEvent(!isEditingEvent)}
                className="h-8 px-3 rounded-lg bg-[#16161A] border border-[#2B2B33] hover:border-white text-white flex items-center gap-1.5 text-[12px] font-medium transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingEvent ? 'Cancel Edit' : 'Edit Event'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-[#161619] border border-[#262629] hover:border-white/40 text-[#888] hover:text-white flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3 text-[#888]">
            <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[13px] font-mono">Loading event & ticket information...</p>
          </div>
        ) : error || !eventData ? (
          <div className="p-16 text-center text-white">
            <p className="font-semibold text-red-400">Failed to load event details.</p>
            <p className="text-[12px] text-[#888] mt-1">{error}</p>
          </div>
        ) : (
          <div className="overflow-y-auto p-5 sm:p-8 flex flex-col gap-8">
            {/* Master Owner Quick Edit Form */}
            {isEditingEvent && (
              <div className="p-5 rounded-[16px] bg-[#121118] border border-[#403360] flex flex-col gap-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-[#2E2445] pb-2">
                  <h4 className="font-heading font-semibold text-white text-[15px] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#C084FC]" />
                    Master Edit: Event Details & Coordinates
                  </h4>
                  <span className="text-[11px] font-mono text-[#D8B4FE]">Direct Database Sync</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <label className="text-[11px] uppercase font-mono text-[#AAA]">Event Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#0C0C0E] border border-[#2E2445] text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase font-mono text-[#AAA]">Date Display</label>
                    <input
                      type="text"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#0C0C0E] border border-[#2E2445] text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase font-mono text-[#AAA]">Venue Name</label>
                    <input
                      type="text"
                      value={editVenue}
                      onChange={(e) => setEditVenue(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#0C0C0E] border border-[#2E2445] text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase font-mono text-[#AAA]">Full Address</label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#0C0C0E] border border-[#2E2445] text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase font-mono text-[#AAA]">Latitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editLat}
                      onChange={(e) => setEditLat(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#0C0C0E] border border-[#2E2445] text-white mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase font-mono text-[#AAA]">Longitude</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editLng}
                      onChange={(e) => setEditLng(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-[#0C0C0E] border border-[#2E2445] text-white mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsEditingEvent(false)}
                    className="px-4 py-1.5 rounded-lg border border-[#333] text-[#AAA] hover:text-white text-[12px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEventEdits}
                    disabled={savingEdit}
                    className="px-5 py-1.5 rounded-lg bg-white text-black font-semibold text-[12px] hover:bg-neutral-200"
                  >
                    {savingEdit ? 'Saving...' : 'Save & Publish Live'}
                  </button>
                </div>
              </div>
            )}

            {/* TOP SECTION: Two-column layout matching authentic axess.zone layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Big Vertical Poster */}
              <div className="lg:col-span-7 flex justify-center">
                <div className="w-full max-w-[460px] rounded-[14px] overflow-hidden border border-[#212121] bg-[#111111] shadow-2xl">
                  <img
                    src={eventData.poster_url || eventData.banner_url}
                    alt={eventData.title}
                    className="w-full h-auto object-cover rounded-[14px]"
                  />
                </div>
              </div>

              {/* Right Column: Ticket Information Box */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="rounded-[16px] border border-[#212121] bg-[#0c0c0e] p-5 sm:p-6 shadow-xl flex flex-col">
                  <h3 className="font-heading text-white font-medium text-[17px] mb-5">
                    Ticket Information
                  </h3>

                  <div className="flex flex-col">
                    {tiers.map((tier) => {
                      const isAvailable = tier.sale_state === 'Available Now';

                      return (
                        <div
                          key={tier.id}
                          className="py-4 border-b border-[#1E1E22] last:border-b-0 flex items-center justify-between gap-4"
                        >
                          {/* Tier Info Left */}
                          <div className="flex flex-col">
                            <span className="font-heading text-[12px] uppercase font-mono tracking-wider text-[#A1A1AA]">
                              {tier.name}
                            </span>
                            <span className="font-heading text-[22px] font-bold text-white mt-0.5">
                              ₹{tier.price?.toLocaleString()}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className={`text-[12px] font-medium ${
                                  isAvailable ? 'text-[#22c55e]' : 'text-[#71717A]'
                                }`}
                              >
                                {tier.sale_state}
                              </span>

                              {/* Master Admin Quick Toggle */}
                              {isMasterOwner && (
                                <button
                                  onClick={() => handleToggleTierStatus(tier.id, tier.sale_state)}
                                  title="Master Owner: Toggle tier state"
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-[#201933] border border-[#47346A] text-[#C084FC] hover:brightness-125"
                                >
                                  Toggle
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons Right (Dual Buttons matching website screenshot) */}
                          <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                            {isAvailable ? (
                              <>
                                <button
                                  onClick={() => handleAddToCart(tier)}
                                  className="h-9 px-3.5 rounded-[6px] border border-white text-white text-[13px] font-medium hover:bg-white/10 active:scale-95 transition-all whitespace-nowrap"
                                >
                                  + Add to Cart
                                </button>
                                <button
                                  onClick={() => handleStartHoldReservation(tier)}
                                  disabled={reserving}
                                  className="h-9 px-4 rounded-[6px] bg-white text-black text-[13px] font-semibold hover:bg-neutral-200 active:scale-95 transition-all whitespace-nowrap shadow-sm"
                                >
                                  Book Tickets
                                </button>
                              </>
                            ) : (
                              <button
                                disabled
                                className="h-9 px-6 rounded-[6px] border border-[#26262A] bg-[#141416] text-[#71717A] text-[13px] font-medium cursor-not-allowed whitespace-nowrap"
                              >
                                Tier Closed
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quantity Stepper & Subtotal when selected */}
                  {selectedTier && selectedTier.sale_state === 'Available Now' && (
                    <div className="mt-4 pt-4 border-t border-[#1E1E22] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] text-[#A1A1AA] uppercase font-mono">Qty:</span>
                        <div className="flex items-center gap-2 bg-[#141417] border border-[#222226] px-2 py-0.5 rounded-full">
                          <button
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                            className="w-6 h-6 flex items-center justify-center text-[#888] hover:text-white disabled:opacity-30"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-heading font-semibold text-[13px] text-white min-w-[16px] text-center">
                            {quantity}
                          </span>
                          <button
                            onClick={() => setQuantity((q) => Math.min(selectedTier.max_per_order || 6, q + 1))}
                            disabled={quantity >= (selectedTier.max_per_order || 6)}
                            className="w-6 h-6 flex items-center justify-center text-[#888] hover:text-white disabled:opacity-30"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-[#71717A] uppercase font-mono">Subtotal</span>
                        <p className="font-heading text-[16px] font-bold text-white">
                          ₹{subtotal.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {addedToCartToast && (
                    <div className="mt-3 p-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-[12px] flex items-center gap-2 animate-in fade-in duration-150">
                      <ShoppingBag className="w-4 h-4 text-white" />
                      <span>{addedToCartToast}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BOTTOM SECTION: About Event, Organizer, Event Location */}
            <div className="flex flex-col gap-6 pt-2">
              {/* About Event */}
              <div className="flex flex-col">
                <h3 className="font-heading text-[20px] font-semibold text-white tracking-tight mb-2">
                  About Event
                </h3>
                <p className="font-body text-[15px] font-medium text-white mb-3">
                  {eventData.subtitle || eventData.title}
                </p>

                <div className="space-y-1.5 text-[14px] text-[#D4D4D8] mb-3">
                  <p className="flex items-center gap-2">
                    <span className="text-[#A1A1AA] font-normal">When?</span>
                    <span>🗓️ {eventData.date_display}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-[#A1A1AA] font-normal">Where?</span>
                    <span>📍 {eventData.venue_name}</span>
                  </p>
                </div>

                <div className="text-[14px] text-[#A1A1AA] leading-relaxed whitespace-pre-line font-body">
                  {descriptionExpanded
                    ? eventData.description
                    : eventData.description?.slice(0, 260) + (eventData.description?.length > 260 ? '...' : '')}
                </div>

                {eventData.description?.length > 260 && (
                  <button
                    onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                    className="self-start mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-white hover:text-neutral-300"
                  >
                    <span>{descriptionExpanded ? 'View Less' : 'View More'}</span>
                    {descriptionExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* Organizer Section */}
              <div className="flex flex-col border-t border-[#1C1C22] pt-6">
                <h3 className="font-heading text-[18px] font-semibold text-white tracking-tight mb-1.5">
                  Organizer
                </h3>
                <p className="font-body text-[14px] text-[#D4D4D8]">
                  {organizer?.company_name || organizer?.name || 'Dimensional Magic Tribe'}
                </p>
              </div>

              {/* Event Location Section */}
              <div className="flex flex-col border-t border-[#1C1C22] pt-6">
                <h3 className="font-heading text-[18px] font-semibold text-white tracking-tight mb-2">
                  Event Location
                </h3>
                <p className="font-body text-[14px] text-[#A1A1AA] flex items-center gap-1.5 mb-3">
                  <span>📍</span>
                  <span>{eventData.venue_name}, {eventData.location_city}</span>
                  {eventData.venue_address && (
                    <span className="text-[#71717A] text-[12px] font-mono">({eventData.venue_address})</span>
                  )}
                </p>

                {/* Working OpenStreetMap Map */}
                <LeafletMap
                  lat={eventData.lat}
                  lng={eventData.lng}
                  venueName={eventData.venue_name}
                  venueAddress={eventData.venue_address}
                  height="280px"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
