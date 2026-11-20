import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { X, Plus, ToggleLeft, ToggleRight } from 'lucide-react';

export default function OrganizerPortal({ onClose, onOpenGateScanner }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [eventDetail, setEventDetail] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [activeTab, setActiveTab] = useState('tiers'); // 'tiers', 'create', 'sales'

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCategory, setNewCategory] = useState('Music');
  const [newCity, setNewCity] = useState('Goa');
  const [newVenue, setNewVenue] = useState('');
  const [newDateDisplay, setNewDateDisplay] = useState('');
  const [newBanner, setNewBanner] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriceMin, setNewPriceMin] = useState(1500);
  const [newPriceMax, setNewPriceMax] = useState(4000);
  const [creating, setCreating] = useState(false);

  const loadOrganizerData = () => {
    setLoading(true);
    api.getEvents()
      .then((res) => {
        setEvents(res.events || []);
        if (res.events && res.events.length > 0) {
          const defaultEventId = res.events[0].id;
          setSelectedEventId(defaultEventId);
          loadEventTiers(defaultEventId);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const loadEventTiers = (evId) => {
    api.getEventDetail(evId)
      .then((res) => {
        setEventDetail(res.event);
        setTiers(res.tiers || []);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadOrganizerData();
  }, []);

  const handleToggleTierState = async (tierId, currentState) => {
    const nextState = currentState === 'Available Now' ? 'Tier Closed' : 'Available Now';
    try {
      await api.updateTierStatus(tierId, nextState);
      setTiers((prev) =>
        prev.map((t) => (t.id === tierId ? { ...t, sale_state: nextState } : t))
      );
    } catch (err) {
      alert(`Failed to update tier status: ${err.message}`);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newTitle || !newVenue || !newBanner || !newDesc) {
      alert('Please fill out all required event details.');
      return;
    }

    setCreating(true);
    try {
      const res = await api.createEvent({
        title: newTitle,
        subtitle: newSubtitle || null,
        category: newCategory,
        locationCity: newCity,
        venueName: newVenue,
        venueAddress: `${newVenue}, ${newCity}`,
        dateDisplay: newDateDisplay || 'Upcoming Weekend',
        bannerUrl: newBanner,
        posterUrl: newBanner,
        description: newDesc,
        priceMin: parseInt(newPriceMin, 10),
        priceMax: parseInt(newPriceMax, 10),
        tiers: [
          {
            name: 'General Admission',
            price: parseInt(newPriceMin, 10),
            capacity: 250,
            saleState: 'Available Now'
          },
          {
            name: 'VIP Deck',
            price: parseInt(newPriceMax, 10),
            capacity: 50,
            saleState: 'Available Now'
          }
        ]
      });

      alert(`Event "${newTitle}" created successfully!`);
      setNewTitle('');
      setNewSubtitle('');
      setNewVenue('');
      setNewDateDisplay('');
      setNewBanner('');
      setNewDesc('');
      setActiveTab('tiers');
      loadOrganizerData();
    } catch (err) {
      alert(`Event creation failed: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#111111] border border-[#212121] rounded-[20px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="h-14 px-5 border-b border-[#212121] flex items-center justify-between shrink-0 bg-[#111111]">
          <div className="flex items-center gap-2">
            <span className="font-heading text-[14px] font-semibold text-white tracking-wide">
              Event Organiser Management Portal
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            <span className="text-[11px] font-mono text-[#848484]">{user?.name || 'Temple Twister'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenGateScanner}
              className="h-8 px-3 rounded-[20px] bg-[#161616] border border-white/30 hover:bg-white hover:text-black text-white text-[11px] font-heading font-medium transition-all"
            >
              Open Gate Scanner
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-[#1c1c1c] border border-[#2e2e2e] hover:border-white/40 text-[#848484] hover:text-white flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Control Bar: Event Selector & Tabs */}
        <div className="p-4 border-b border-[#212121] bg-[#141414] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-mono uppercase text-[#606060]">Event:</label>
            <select
              value={selectedEventId || ''}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                loadEventTiers(e.target.value);
              }}
              className="h-8 px-2.5 rounded-[10px] bg-[#161616] border border-[#212121] text-white text-[12px] font-heading outline-none"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.location_city})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('tiers')}
              className={`h-8 px-3 rounded-[20px] text-[12px] font-heading font-medium transition-all ${
                activeTab === 'tiers'
                  ? 'bg-white text-black font-semibold'
                  : 'bg-[#161616] border border-[#212121] text-[#848484] hover:text-white'
              }`}
            >
              Manage Tiers
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`h-8 px-3 rounded-[20px] text-[12px] font-heading font-medium transition-all flex items-center gap-1 ${
                activeTab === 'create'
                  ? 'bg-white text-black font-semibold'
                  : 'bg-[#161616] border border-[#212121] text-[#848484] hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-5">
          {activeTab === 'tiers' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-heading text-[16px] font-semibold text-white">Ticket Tiers & Live Quotas</h4>
                  <p className="text-[12px] text-[#848484] font-body">
                    Toggle sales between "Available Now" and "Tier Closed". Real-time updates propagate live to active clients.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {tiers.map((tier) => (
                  <div
                    key={tier.id}
                    className="p-4 rounded-[12px] bg-[#161616] border border-[#212121] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-heading text-[15px] font-semibold text-white">{tier.name}</h5>
                        <span
                          className={`px-2 py-0.5 rounded-[10px] text-[10px] font-mono uppercase ${
                            tier.sale_state === 'Available Now'
                              ? 'bg-white text-black font-semibold'
                              : 'bg-[#1c1c1c] border border-[#2e2e2e] text-[#848484]'
                          }`}
                        >
                          {tier.sale_state}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#848484] font-body mt-0.5">₹{tier.price.toLocaleString()} per pass</p>
                      <p className="text-[11px] font-mono text-[#606060] mt-1">
                        Sold: {tier.sold_count} / Capacity: {tier.capacity} (Available: {tier.capacity - tier.sold_count})
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleTierState(tier.id, tier.sale_state)}
                        className={`h-8 px-4 rounded-[20px] font-heading text-[12px] font-medium transition-all flex items-center gap-2 ${
                          tier.sale_state === 'Available Now'
                            ? 'bg-[#1c1c1c] border border-[#2e2e2e] text-[#848484] hover:text-white hover:border-white/40'
                            : 'bg-white text-black hover:bg-[#e0e0e0]'
                        }`}
                      >
                        {tier.sale_state === 'Available Now' ? (
                          <>
                            <ToggleLeft className="w-4 h-4 text-white" />
                            <span>Set to "Tier Closed"</span>
                          </>
                        ) : (
                          <>
                            <ToggleRight className="w-4 h-4 text-black" />
                            <span>Set to "Available Now"</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreateEvent} className="flex flex-col gap-4">
              <div>
                <h4 className="font-heading text-[16px] font-semibold text-white">Publish New Live Event</h4>
                <p className="text-[12px] text-[#848484] font-body">
                  New events will instantly appear in the discovery feed across all connected browser clients.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono uppercase text-[#848484]">Event Title *</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Sub-Sonic Convergence"
                    className="h-9 px-3 rounded-[10px] bg-[#0d0d0d] border border-[#262626] focus:border-white text-white text-[13px] font-body outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono uppercase text-[#848484]">Subtitle / Tagline</label>
                  <input
                    type="text"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    placeholder="e.g. 24 Hrs Hypnotic Gathering"
                    className="h-9 px-3 rounded-[10px] bg-[#0d0d0d] border border-[#262626] focus:border-white text-white text-[13px] font-body outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono uppercase text-[#848484]">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="h-9 px-3 rounded-[10px] bg-[#0d0d0d] border border-[#262626] text-white text-[13px] font-body outline-none"
                  >
                    <option value="Music">Music</option>
                    <option value="Festival">Festival</option>
                    <option value="Nightlife">Nightlife</option>
                    <option value="Community">Community</option>
                    <option value="Arts & Theatre">Arts & Theatre</option>
                    <option value="Wellness">Wellness</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono uppercase text-[#848484]">Location City</label>
                  <select
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="h-9 px-3 rounded-[10px] bg-[#0d0d0d] border border-[#262626] text-white text-[13px] font-body outline-none"
                  >
                    <option value="Goa">Goa</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Kasol">Kasol</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono uppercase text-[#848484]">Venue Name *</label>
                  <input
                    type="text"
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    placeholder="e.g. House Of Chapora, Goa"
                    className="h-9 px-3 rounded-[10px] bg-[#0d0d0d] border border-[#262626] focus:border-white text-white text-[13px] font-body outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono uppercase text-[#848484]">Date Display *</label>
                  <input
                    type="text"
                    value={newDateDisplay}
                    onChange={(e) => setNewDateDisplay(e.target.value)}
                    placeholder="e.g. Dec 28, 2026"
                    className="h-9 px-3 rounded-[10px] bg-[#0d0d0d] border border-[#262626] focus:border-white text-white text-[13px] font-body outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-mono uppercase text-[#848484]">Artwork Image URL *</label>
                  <input
                    type="url"
                    value={newBanner}
                    onChange={(e) => setNewBanner(e.target.value)}
                    placeholder="https://images.unsplash.com/... or media link"
                    className="h-9 px-3 rounded-[10px] bg-[#0d0d0d] border border-[#262626] focus:border-white text-white text-[13px] font-mono outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[10px] font-mono uppercase text-[#848484]">Description *</label>
                  <textarea
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Detailed lineup, sound system specs, and gathering notes..."
                    className="p-3 rounded-[10px] bg-[#0d0d0d] border border-[#262626] focus:border-white text-white text-[13px] font-body outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full h-10 rounded-[24px] bg-white text-black font-heading text-[13px] font-semibold hover:bg-[#e0e0e0] active:scale-95 transition-all disabled:opacity-50 mt-2 shadow-sm"
              >
                {creating ? 'Publishing Event...' : 'Publish Event to Axess Registry'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}