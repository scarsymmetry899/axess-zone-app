import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import {
  X,
  ShieldCheck,
  RefreshCw,
  Radio,
  Calendar,
  Users,
  Plus,
  Trash2,
  Edit,
  Check,
  MapPin,
  TrendingUp,
  Tag
} from 'lucide-react';

export default function AdminPortal({ onClose, onEventCreated }) {
  const { user } = useAuth();
  const { connected } = useSocket();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'events' | 'create' | 'users'
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // Selected event for tier editing
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventTiers, setEventTiers] = useState([]);
  const [loadingTiers, setLoadingTiers] = useState(false);

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    subtitle: '',
    category: 'Music',
    location_city: 'Goa',
    venue_name: '',
    venue_address: '',
    lat: 15.395,
    lng: 73.8115,
    banner_url: 'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1790489323768-UV_AXESS_BANNER_V01-banner-1790489323506.webp',
    poster_url: 'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1790489303512-uv_27_axess_post-poster-1790489302740.webp',
    date_display: 'Dec 31, 2026 – Jan 01, 2027',
    price_min: 1999,
    price_max: 4999,
    description: '',
    is_featured: 1
  });
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([api.getAdminOverview(), api.getAdminUsers(), api.getEvents({ past: 'false' })])
      .then(([overRes, userRes, evRes]) => {
        setOverview(overRes);
        setUsers(userRes.users || []);
        setEvents(evRes.events || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerSync = async () => {
    setSyncing(true);
    try {
      const res = await api.triggerLiveSync({
        message: 'Upstream Axess website sync trigger executed by App Owner'
      });
      setSyncMsg(res.message);
      setTimeout(() => setSyncMsg(''), 4000);
      loadData();
    } catch (err) {
      alert(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenTierManager = async (eventId) => {
    if (editingEventId === eventId) {
      setEditingEventId(null);
      return;
    }
    setEditingEventId(eventId);
    setLoadingTiers(true);
    try {
      const res = await api.getEventDetail(eventId);
      setEventTiers(res.tiers || []);
    } catch (err) {
      alert(`Failed to load tiers: ${err.message}`);
    } finally {
      setLoadingTiers(false);
    }
  };

  const handleToggleTier = async (tierId, currentStatus) => {
    const nextStatus = currentStatus === 'Available Now' ? 'Tier Closed' : 'Available Now';
    try {
      await api.updateTierStatus(tierId, nextStatus);
      setEventTiers((prev) =>
        prev.map((t) => (t.id === tierId ? { ...t, sale_state: nextStatus } : t))
      );
    } catch (err) {
      alert(`Failed to update tier: ${err.message}`);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event from the platform?')) return;
    try {
      await api.deleteEvent(eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err) {
      alert(`Failed to delete event: ${err.message}`);
    }
  };

  const handleCreateEventSubmit = async (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.venue_name || !newEvent.description) {
      alert('Please fill in title, venue, and description.');
      return;
    }

    setCreatingEvent(true);
    try {
      const payload = {
        ...newEvent,
        tiers: [
          {
            name: 'Early Bird Pass',
            price: Number(newEvent.price_min) || 1499,
            capacity: 250,
            sale_state: 'Available Now',
            perks: ['General Admission', 'Full Sound Access']
          },
          {
            name: 'VIP Backstage Access',
            price: Number(newEvent.price_max) || 4499,
            capacity: 50,
            sale_state: 'Available Now',
            perks: ['VIP Lounge', 'Fast Track Gate Entry', 'Artist Deck Access']
          }
        ]
      };
      const res = await api.createEvent(payload);
      setCreateSuccessMsg('Event created and broadcasted live!');
      setTimeout(() => setCreateSuccessMsg(''), 4000);
      loadData();
      setActiveTab('events');
      if (onEventCreated) onEventCreated();
    } catch (err) {
      alert(`Failed to create event: ${err.message}`);
    } finally {
      setCreatingEvent(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-[#0A0A0C] border border-[#212121] rounded-[24px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="h-16 px-6 border-b border-[#212121] flex items-center justify-between shrink-0 bg-[#0A0A0C]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#201736] border border-[#44336B] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#C084FC]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading text-[15px] font-semibold text-white tracking-tight">
                  App Owner Master Control
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#31264E] text-[#D8B4FE] border border-[#4C3B78] font-bold">
                  SUPERADMIN
                </span>
              </div>
              <p className="text-[11px] text-[#848484] font-mono">
                Full root authority over all events, ticket tiers, orders, check-in gates, and sync engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close admin portal"
            className="w-8 h-8 rounded-full bg-[#161619] border border-[#262629] hover:border-white/40 text-[#888] hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-[#1C1C22] shrink-0 bg-[#0D0D10] overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#888] hover:text-white hover:bg-[#16161A]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Overview & Metrics</span>
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all flex items-center gap-2 ${
              activeTab === 'events'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#888] hover:text-white hover:bg-[#16161A]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Manage All Events ({events.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all flex items-center gap-2 ${
              activeTab === 'create'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#888] hover:text-white hover:bg-[#16161A]'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add New Event</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#888] hover:text-white hover:bg-[#16161A]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users & Roles ({users.length})</span>
          </button>
        </div>

        {/* Content Body */}
        {loading || !overview ? (
          <div className="p-20 flex flex-col items-center justify-center gap-2 text-[#888]">
            <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[12px] font-mono">Loading master control database...</p>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto max-h-[75vh] flex flex-col gap-6">
            {/* TAB 1: OVERVIEW & METRICS */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-[14px] bg-[#121215] border border-[#212126]">
                    <span className="text-[10px] uppercase font-mono text-[#848484]">Gross Sales Volume</span>
                    <p className="font-heading text-[22px] font-bold text-white mt-1">
                      ₹{overview.metrics?.grossSalesVolumeINR?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="p-4 rounded-[14px] bg-[#121215] border border-[#212126]">
                    <span className="text-[10px] uppercase font-mono text-[#848484]">Passes Sold</span>
                    <p className="font-heading text-[22px] font-bold text-white mt-1">
                      {overview.metrics?.totalTicketsSold || '0'}
                    </p>
                  </div>
                  <div className="p-4 rounded-[14px] bg-[#121215] border border-[#212126]">
                    <span className="text-[10px] uppercase font-mono text-[#848484]">Active Holds (TTL)</span>
                    <p className="font-heading text-[22px] font-bold text-white mt-1">
                      {overview.metrics?.activeHoldsCount || '0'}
                    </p>
                  </div>
                  <div className="p-4 rounded-[14px] bg-[#121215] border border-[#212126]">
                    <span className="text-[10px] uppercase font-mono text-[#848484]">Gate Checked In</span>
                    <p className="font-heading text-[22px] font-bold text-white mt-1">
                      {overview.metrics?.totalCheckedIn || '0'} / {overview.metrics?.totalTicketsSold || '0'}
                    </p>
                  </div>
                </div>

                {/* Real-time Website Synchronizer */}
                <div className="p-5 rounded-[16px] bg-[#121216] border border-[#24242A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-white" />
                      <h4 className="font-heading font-semibold text-white text-[15px]">
                        Master WebSocket Real-Time Synchronizer
                      </h4>
                    </div>
                    <p className="text-[12px] text-[#A1A1AA] font-body mt-1 max-w-xl">
                      Broadcasts live tier price updates, phase releases, or inventory state changes to all connected attendee apps instantly without manual page refreshes.
                    </p>
                    {syncMsg && <p className="text-[12px] text-green-400 font-mono mt-1 font-semibold">{syncMsg}</p>}
                  </div>

                  <button
                    onClick={handleTriggerSync}
                    disabled={syncing}
                    className="h-9 px-5 rounded-[10px] bg-white text-black font-heading text-[13px] font-medium hover:bg-neutral-200 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-40 shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    <span>{syncing ? 'Broadcasting...' : 'Trigger Global Sync'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: MANAGE ALL EVENTS */}
            {activeTab === 'events' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-heading text-[16px] font-semibold text-white">
                    Platform Event Directory ({events.length} Events)
                  </h4>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-3.5 py-1.5 rounded-lg bg-white text-black font-semibold text-[12px] flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Event</span>
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-[14px] bg-[#111114] border border-[#212126] flex flex-col gap-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={ev.poster_url || ev.banner_url}
                            alt={ev.title}
                            className="w-12 h-15 object-cover rounded-lg border border-[#2A2A30] shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-heading font-semibold text-white text-[15px]">{ev.title}</h5>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1C1C22] text-[#A1A1AA] border border-[#282830]">
                                {ev.category}
                              </span>
                            </div>
                            <p className="text-[12px] text-[#848484] flex items-center gap-2 mt-0.5">
                              <span>{ev.date_display}</span>
                              <span>•</span>
                              <span>{ev.venue_name} ({ev.location_city})</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleOpenTierManager(ev.id)}
                            className="h-8 px-3 rounded-lg bg-[#18181D] border border-[#2A2A32] hover:border-white text-white text-[12px] font-medium flex items-center gap-1.5"
                          >
                            <Tag className="w-3 h-3 text-[#A1A1AA]" />
                            <span>{editingEventId === ev.id ? 'Close Tiers' : 'Manage Tiers'}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            title="Delete event"
                            className="w-8 h-8 rounded-lg bg-red-950/30 border border-red-500/20 hover:border-red-500 text-red-400 flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Tier Controller for this event */}
                      {editingEventId === ev.id && (
                        <div className="mt-2 pt-3 border-t border-[#1E1E24] flex flex-col gap-2 bg-[#0C0C0E] p-3 rounded-xl border border-[#202026]">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-[#A1A1AA]">
                            Ticket Tiers for {ev.title}:
                          </span>

                          {loadingTiers ? (
                            <p className="text-[12px] text-[#888] font-mono">Loading tiers...</p>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {eventTiers.map((t) => (
                                <div
                                  key={t.id}
                                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#141418] border border-[#212126] text-[13px]"
                                >
                                  <div>
                                    <span className="font-semibold text-white">{t.name}</span>
                                    <span className="text-[#A1A1AA] font-mono ml-2">₹{t.price?.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-[11px] font-mono ${
                                        t.sale_state === 'Available Now' ? 'text-green-400' : 'text-neutral-500'
                                      }`}
                                    >
                                      {t.sale_state}
                                    </span>
                                    <button
                                      onClick={() => handleToggleTier(t.id, t.sale_state)}
                                      className="px-2.5 py-1 rounded bg-[#201c2a] border border-[#3b3252] text-[#c084fc] hover:brightness-125 text-[11px] font-medium"
                                    >
                                      Toggle State
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: CREATE NEW EVENT */}
            {activeTab === 'create' && (
              <form onSubmit={handleCreateEventSubmit} className="flex flex-col gap-4">
                <div className="border-b border-[#212126] pb-2">
                  <h4 className="font-heading text-[16px] font-semibold text-white">Create & Publish New Event</h4>
                  <p className="text-[12px] text-[#848484]">
                    Add a new marquee gathering to the discovery feed, ticket matrix, and map.
                  </p>
                </div>

                {createSuccessMsg && (
                  <div className="p-3 rounded-lg bg-green-950/40 border border-green-500/30 text-green-300 text-[13px]">
                    {createSuccessMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
                  <div>
                    <label className="text-[11px] uppercase font-mono text-[#AAA]">Event Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Solstice Sound Ritual"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-[#141418] border border-[#24242A] text-white mt-1 focus:outline-none focus:border-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase font-mono text-[#AAA]">Subtitle / Presenter</label>
                    <input
                      type="text"
                      placeholder="e.g. 3-Day Sonic Experience"
                      value={newEvent.subtitle}
                      onChange={(e) => setNewEvent({ ...newEvent, subtitle: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-[#141418] border border-[#24242A] text-white mt-1 focus:outline-none focus:border-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase font-mono text-[#AAA]">Category</label>
                    <select
                      value={newEvent.category}
                      onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-[#141418] border border-[#24242A] text-white mt-1 focus:outline-none focus:border-white"
                    >
                      <option value="Festival">Festival</option>
                      <option value="Nightlife">Nightlife</option>
                      <option value="Music">Music</option>
                      <option value="Community">Community</option>
                      <option value="Arts & Theatre">Arts & Theatre</option>
                      <option value="Wellness">Wellness</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase font-mono text-[#AAA]">Location City</label>
                    <select
                      value={newEvent.location_city}
                      onChange={(e) => setNewEvent({ ...newEvent, location_city: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-[#141418] border border-[#24242A] text-white mt-1 focus:outline-none focus:border-white"
                    >
                      <option value="Goa">Goa</option>
                      <option value="Bangalore">Bangalore</option>
                      <option value="Kasol">Kasol</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] uppercase font-mono text-[#AAA]">Venue Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HillTop Goa"
                      value={newEvent.venue_name}
                      onChange={(e) => setNewEvent({ ...newEvent, venue_name: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-[#141418] border border-[#24242A] text-white mt-1 focus:outline-none focus:border-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase font-mono text-[#AAA]">Venue Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Vagator, Goa 403509"
                      value={newEvent.venue_address}
                      onChange={(e) => setNewEvent({ ...newEvent, venue_address: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-[#141418] border border-[#24242A] text-white mt-1 focus:outline-none focus:border-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase font-mono text-[#AAA]">Date Display *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dec 31, 2026 – Jan 01, 2027"
                      value={newEvent.date_display}
                      onChange={(e) => setNewEvent({ ...newEvent, date_display: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-[#141418] border border-[#24242A] text-white mt-1 focus:outline-none focus:border-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase font-mono text-[#AAA]">Price Range (Min - Max ₹)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={newEvent.price_min}
                        onChange={(e) => setNewEvent({ ...newEvent, price_min: Number(e.target.value) })}
                        className="w-1/2 h-10 px-3 rounded-lg bg-[#141418] border border-[#24242A] text-white mt-1"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={newEvent.price_max}
                        onChange={(e) => setNewEvent({ ...newEvent, price_max: Number(e.target.value) })}
                        className="w-1/2 h-10 px-3 rounded-lg bg-[#141418] border border-[#24242A] text-white mt-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] uppercase font-mono text-[#AAA]">Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe the artists, acoustic installations, and event experience..."
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full p-3 rounded-lg bg-[#141418] border border-[#24242A] text-white mt-1 focus:outline-none focus:border-white text-[13px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingEvent}
                  className="mt-2 h-11 px-6 rounded-xl bg-white text-black font-semibold text-[14px] hover:bg-neutral-200 active:scale-95 transition-all self-start"
                >
                  {creatingEvent ? 'Publishing Event...' : 'Publish Event Live'}
                </button>
              </form>
            )}

            {/* TAB 4: USERS & ROLES */}
            {activeTab === 'users' && (
              <div className="flex flex-col gap-3">
                <h4 className="font-heading text-[14px] font-semibold text-white">Registered Multi-Role Entities</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[12px] font-mono border border-[#212126] rounded-[10px] overflow-hidden">
                    <thead className="bg-[#121215] text-[#848484] border-b border-[#212126]">
                      <tr>
                        <th className="p-3">Entity Name</th>
                        <th className="p-3">Email Address</th>
                        <th className="p-3">System Role</th>
                        <th className="p-3">Affiliation / Org</th>
                        <th className="p-3">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1D1D22] bg-[#141418]">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-[#1A1A20]">
                          <td className="p-3 text-white font-semibold font-heading">{u.name}</td>
                          <td className="p-3 text-[#A1A1AA]">{u.email}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                                u.role === 'ADMIN'
                                  ? 'bg-[#31264E] text-[#D8B4FE] border border-[#4C3B78] font-bold'
                                  : 'bg-[#1C1C22] text-[#A1A1AA] border border-[#2B2B33]'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3 text-[#71717A]">{u.company_name || 'Individual Attendee'}</td>
                          <td className="p-3 text-[#71717A]">{new Date(u.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
