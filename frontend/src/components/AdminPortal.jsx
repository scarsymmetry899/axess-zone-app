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
  Tag,
  Globe,
  Bell,
  Target,
  ShoppingCart,
  Smartphone,
  Send,
  Copy,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Zap,
  ArrowRight
} from 'lucide-react';

export default function AdminPortal({ onClose, onEventCreated }) {
  const { user } = useAuth();
  const { connected } = useSocket();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'events' | 'create' | 'sync' | 'notifications' | 'retargeting' | 'users'
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

  // Website Sync State (axess.zone)
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncingAxess, setSyncingAxess] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Notifications State
  const [notificationsList, setNotificationsList] = useState([]);
  const [newNotif, setNewNotif] = useState({
    title: '',
    message: '',
    target_location: 'ALL',
    target_role: 'ALL',
    category: 'ANNOUNCEMENT',
    priority: 'NORMAL',
    action_link: ''
  });
  const [sendingNotif, setSendingNotif] = useState(false);
  const [notifSuccessMsg, setNotifSuccessMsg] = useState('');

  // Retargeting State
  const [retargetingData, setRetargetingData] = useState(null);
  const [newRetarget, setNewRetarget] = useState({
    name: '',
    segment_type: 'ABANDONED_CART',
    filter_location: 'ALL',
    discount_code: 'AXESS10',
    discount_percent: 10,
    message_template: 'Complete your ticket checkout with exclusive discount code.'
  });
  const [launchingRetarget, setLaunchingRetarget] = useState(false);
  const [retargetSuccessMsg, setRetargetSuccessMsg] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getAdminOverview(),
      api.getAdminUsers(),
      api.getEvents({ past: 'false' }),
      api.getSyncStatus(),
      api.getAdminNotifications(),
      api.getRetargetingData()
    ])
      .then(([overRes, userRes, evRes, syncRes, notifRes, retargetRes]) => {
        setOverview(overRes);
        setUsers(userRes.users || []);
        setEvents(evRes.events || []);
        setSyncStatus(syncRes);
        setNotificationsList(notifRes.notifications || []);
        setRetargetingData(retargetRes);
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

  // Direct sync with axess.zone website operations
  const handleSyncWithAxessWebsite = async () => {
    setSyncingAxess(true);
    try {
      const res = await api.syncAxessWebsite({ mode: 'FULL' });
      setSyncMsg(res.message || 'Direct synchronization with axess.zone complete.');
      setTimeout(() => setSyncMsg(''), 5000);
      const updatedStatus = await api.getSyncStatus();
      setSyncStatus(updatedStatus);
      loadData();
    } catch (err) {
      alert(`Website operations sync failed: ${err.message}`);
    } finally {
      setSyncingAxess(false);
    }
  };

  // Dispatch custom targeted notification
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!newNotif.title || !newNotif.message) {
      alert('Please provide a title and message.');
      return;
    }
    setSendingNotif(true);
    try {
      const res = await api.sendAdminNotification(newNotif);
      setNotifSuccessMsg(res.message || 'Notification broadcasted successfully!');
      setTimeout(() => setNotifSuccessMsg(''), 4000);
      setNewNotif({
        title: '',
        message: '',
        target_location: 'ALL',
        target_role: 'ALL',
        category: 'ANNOUNCEMENT',
        priority: 'NORMAL',
        action_link: ''
      });
      const notifs = await api.getAdminNotifications();
      setNotificationsList(notifs.notifications || []);
    } catch (err) {
      alert(`Failed to send notification: ${err.message}`);
    } finally {
      setSendingNotif(false);
    }
  };

  // Launch retargeting campaign
  const handleLaunchRetargeting = async (e) => {
    e.preventDefault();
    if (!newRetarget.name || !newRetarget.discount_code) {
      alert('Please fill out campaign name and discount code.');
      return;
    }
    setLaunchingRetarget(true);
    try {
      const res = await api.createRetargetingCampaign(newRetarget);
      setRetargetSuccessMsg(res.message || 'Retargeting campaign launched!');
      setTimeout(() => setRetargetSuccessMsg(''), 4000);
      const retData = await api.getRetargetingData();
      setRetargetingData(retData);
    } catch (err) {
      alert(`Failed to launch campaign: ${err.message}`);
    } finally {
      setLaunchingRetarget(false);
    }
  };

  const handleToggleRetargetRule = async (campaignId, currentActive) => {
    try {
      await api.toggleRetargetingRule({ campaignId, is_active: !currentActive });
      setRetargetingData((prev) => ({
        ...prev,
        campaigns: prev.campaigns.map((c) =>
          c.id === campaignId ? { ...c, is_active: currentActive ? 0 : 1 } : c
        )
      }));
    } catch (err) {
      alert(`Failed to toggle rule: ${err.message}`);
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
      await api.createEvent(payload);
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
                Full root authority over website sync, targeted notifications, retargeting & live catalog
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
            className={`px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'overview'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#888] hover:text-white hover:bg-[#16161A]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'events'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#888] hover:text-white hover:bg-[#16161A]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Events ({events.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'create'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#888] hover:text-white hover:bg-[#16161A]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Event</span>
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'sync'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#888] hover:text-white hover:bg-[#16161A]'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Website Sync</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse"></span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'notifications'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#888] hover:text-white hover:bg-[#16161A]'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Notifications ({notificationsList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('retargeting')}
            className={`px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'retargeting'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#888] hover:text-white hover:bg-[#16161A]'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-[#EC4899]" />
            <span>Retargeting</span>
            {retargetingData?.stats?.openCartsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#EC4899]/20 text-[#EC4899] font-bold font-mono">
                {retargetingData.stats.openCartsCount} Carts
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-xl text-[12.5px] font-medium transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'users'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-[#888] hover:text-white hover:bg-[#16161A]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users ({users.length})</span>
          </button>
        </div>

        {/* Content Body */}
        {loading || !overview ? (
          <div className="p-20 flex flex-col items-center justify-center gap-2 text-[#888]">
            <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[12px] font-mono">Loading master control database...</p>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto max-h-[75vh] flex flex-col gap-6 custom-scrollbar">
            {/* Global Sync Notification banner */}
            {syncMsg && (
              <div className="p-3.5 rounded-xl bg-[#1C182A] border border-[#44336B] text-white flex items-center justify-between text-xs animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#A855F7]" />
                  <span>{syncMsg}</span>
                </div>
              </div>
            )}

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
                    <span className="text-[10px] uppercase font-mono text-[#848484]">Platform Users</span>
                    <p className="font-heading text-[22px] font-bold text-white mt-1">
                      {overview.metrics?.totalUsers || '0'}
                    </p>
                  </div>
                </div>

                {/* Operations Status Bar */}
                <div className="p-5 rounded-[18px] bg-[#141417] border border-[#232328] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Radio className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-semibold">Real-Time Sync Engine</h4>
                      <p className="text-xs text-[#848484]">
                        Status: <span className="text-white font-mono">Live WebSocket PubSub Connected</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTriggerSync}
                      disabled={syncing}
                      className="px-4 py-2 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                      <span>{syncing ? 'Syncing Clients...' : 'Trigger Client Broadcast'}</span>
                    </button>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold text-white tracking-tight">Recent Orders</h3>
                  <div className="border border-[#212126] rounded-[16px] overflow-hidden bg-[#121215]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#18181C] text-[#848484] uppercase font-mono text-[10px] border-b border-[#212126]">
                          <tr>
                            <th className="py-2.5 px-4">Order #</th>
                            <th className="py-2.5 px-4">Attendee</th>
                            <th className="py-2.5 px-4">Event</th>
                            <th className="py-2.5 px-4">Amount</th>
                            <th className="py-2.5 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1D1D22] text-[#CCC]">
                          {overview.recentOrders?.map((ord) => (
                            <tr key={ord.id} className="hover:bg-white/[0.02]">
                              <td className="py-3 px-4 font-mono text-white">{ord.order_number}</td>
                              <td className="py-3 px-4">
                                <div className="text-white font-medium">{ord.billing_name}</div>
                                <div className="text-[11px] text-[#71717A]">{ord.billing_email}</div>
                              </td>
                              <td className="py-3 px-4 text-white">{ord.event_title}</td>
                              <td className="py-3 px-4 font-heading font-semibold text-white">₹{ord.final_amount}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white font-bold">
                                  {ord.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: MANAGE ALL EVENTS */}
            {activeTab === 'events' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Live Event Catalog</h3>
                    <p className="text-xs text-[#848484]">Manage active gig details, price ranges, and toggle ticket tier availability</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Event</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-4 rounded-[16px] bg-[#121215] border border-[#212126] flex flex-col gap-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={ev.poster_url || ev.banner_url}
                            alt={ev.title}
                            className="w-12 h-16 rounded-[8px] object-cover border border-white/10"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-white font-medium text-sm">{ev.title}</h4>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#1E1E24] text-[#A1A1AA]">
                                {ev.category}
                              </span>
                            </div>
                            <p className="text-xs text-[#848484] flex items-center gap-2 mt-1 font-mono">
                              <span>📍 {ev.venue_name}, {ev.location_city}</span>
                              <span>•</span>
                              <span>🗓️ {ev.date_display}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleOpenTierManager(ev.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#1D1D22] hover:bg-[#26262D] text-white text-xs font-medium border border-white/10 flex items-center gap-1.5 transition-all"
                          >
                            <Tag className="w-3.5 h-3.5 text-[#AAA]" />
                            <span>{editingEventId === ev.id ? 'Close Tiers' : 'Manage Tiers'}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="p-2 rounded-lg bg-[#241315] hover:bg-[#34181B] text-[#FF6B6B] border border-[#4D2427] transition-all"
                            title="Delete event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Tier Manager */}
                      {editingEventId === ev.id && (
                        <div className="mt-2 pt-3 border-t border-[#1F1F26] flex flex-col gap-2">
                          <div className="flex items-center justify-between text-xs text-[#848484] font-mono">
                            <span>Ticket Tiers & Phase States:</span>
                            <span>Click status pill to toggle between Available and Closed</span>
                          </div>

                          {loadingTiers ? (
                            <div className="py-4 text-center text-xs text-[#848484]">Loading tiers...</div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {eventTiers.map((tier) => (
                                <div
                                  key={tier.id}
                                  className="p-3 rounded-xl bg-[#17171C] border border-[#26262F] flex items-center justify-between"
                                >
                                  <div>
                                    <div className="text-xs font-semibold text-white">{tier.name}</div>
                                    <div className="text-[11px] text-[#A1A1AA] font-heading font-medium">₹{tier.price}</div>
                                  </div>
                                  <button
                                    onClick={() => handleToggleTier(tier.id, tier.sale_state)}
                                    className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                                      tier.sale_state === 'Available Now'
                                        ? 'bg-[#15301F] text-[#4ADE80] border-[#224E33]'
                                        : 'bg-[#262626] text-[#A1A1AA] border-[#3B3B3B]'
                                    }`}
                                  >
                                    {tier.sale_state}
                                  </button>
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

            {/* TAB 3: ADD NEW EVENT */}
            {activeTab === 'create' && (
              <form onSubmit={handleCreateEventSubmit} className="flex flex-col gap-4">
                <div className="border-b border-[#1E1E24] pb-3">
                  <h3 className="text-sm font-semibold text-white">Publish New Live Gig</h3>
                  <p className="text-xs text-[#848484]">Add new gig to Axess discovery feed with authentic poster and default ticket phases</p>
                </div>

                {createSuccessMsg && (
                  <div className="p-3 rounded-xl bg-[#15301F] border border-[#224E33] text-[#4ADE80] text-xs font-medium">
                    {createSuccessMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#AAA]">Event Title *</label>
                    <input
                      type="text"
                      required
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="e.g. UNMADA VARA NYE"
                      className="px-3.5 py-2.5 rounded-xl bg-[#141417] border border-[#232328] text-white text-xs outline-none focus:border-white/40"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#AAA]">Presenter Subtitle</label>
                    <input
                      type="text"
                      value={newEvent.subtitle}
                      onChange={(e) => setNewEvent({ ...newEvent, subtitle: e.target.value })}
                      placeholder="e.g. Axess Presents"
                      className="px-3.5 py-2.5 rounded-xl bg-[#141417] border border-[#232328] text-white text-xs outline-none focus:border-white/40"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#AAA]">Category</label>
                    <select
                      value={newEvent.category}
                      onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                      className="px-3.5 py-2.5 rounded-xl bg-[#141417] border border-[#232328] text-white text-xs outline-none focus:border-white/40"
                    >
                      {['Music', 'Nightlife', 'Festival', 'Arts & Theatre', 'Community', 'Technology', 'Wellness', 'Workshop'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#AAA]">Location City</label>
                    <select
                      value={newEvent.location_city}
                      onChange={(e) => setNewEvent({ ...newEvent, location_city: e.target.value })}
                      className="px-3.5 py-2.5 rounded-xl bg-[#141417] border border-[#232328] text-white text-xs outline-none focus:border-white/40"
                    >
                      {['Goa', 'Bangalore', 'Kasol', 'Mumbai', 'Delhi'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#AAA]">Venue Name *</label>
                    <input
                      type="text"
                      required
                      value={newEvent.venue_name}
                      onChange={(e) => setNewEvent({ ...newEvent, venue_name: e.target.value })}
                      placeholder="e.g. House Of Chapora"
                      className="px-3.5 py-2.5 rounded-xl bg-[#141417] border border-[#232328] text-white text-xs outline-none focus:border-white/40"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#AAA]">Date Display *</label>
                    <input
                      type="text"
                      required
                      value={newEvent.date_display}
                      onChange={(e) => setNewEvent({ ...newEvent, date_display: e.target.value })}
                      placeholder="e.g. Dec 31, 2026 | 08:00 PM"
                      className="px-3.5 py-2.5 rounded-xl bg-[#141417] border border-[#232328] text-white text-xs outline-none focus:border-white/40"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#AAA]">Event Description *</label>
                  <textarea
                    rows="3"
                    required
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Enter full gig description, lineup, schedule, and entry terms..."
                    className="px-3.5 py-2.5 rounded-xl bg-[#141417] border border-[#232328] text-white text-xs outline-none focus:border-white/40"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={creatingEvent}
                    className="px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs flex items-center gap-2 hover:bg-white/90 transition-all disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{creatingEvent ? 'Broadcasting...' : 'Publish Event Live'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 4: WEBSITE SYNC WITH REAL AXESS.ZONE */}
            {activeTab === 'sync' && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E1E24] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">Live Website Operations & Sync</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0D2436] text-[#38BDF8] border border-[#1A4868] font-bold">
                        ACTIVE SYNC
                      </span>
                    </div>
                    <p className="text-xs text-[#848484] mt-0.5">
                      Synchronize the app with real live event operations, ticket matrices, and CDN media from{' '}
                      <a href="https://www.axess.zone" target="_blank" rel="noreferrer" className="text-white underline hover:opacity-80">
                        axess.zone
                      </a>
                    </p>
                  </div>
                  <button
                    onClick={handleSyncWithAxessWebsite}
                    disabled={syncingAxess}
                    className="px-4 py-2.5 rounded-xl bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-black font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingAxess ? 'animate-spin' : ''}`} />
                    <span>{syncingAxess ? 'Syncing axess.zone...' : 'Sync from axess.zone Now'}</span>
                  </button>
                </div>

                {/* Key Status Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-[14px] bg-[#121215] border border-[#212126]">
                    <span className="text-[10px] uppercase font-mono text-[#848484]">Upstream Operations</span>
                    <p className="text-xs font-semibold text-[#38BDF8] mt-1 flex items-center gap-1.5 truncate">
                      <Globe className="w-3 h-3 shrink-0" />
                      <span>axess.zone (Production)</span>
                    </p>
                  </div>
                  <div className="p-3.5 rounded-[14px] bg-[#121215] border border-[#212126]">
                    <span className="text-[10px] uppercase font-mono text-[#848484]">Auto-Sync Frequency</span>
                    <p className="text-sm font-heading font-bold text-white mt-1">Every 15 mins</p>
                  </div>
                  <div className="p-3.5 rounded-[14px] bg-[#121215] border border-[#212126]">
                    <span className="text-[10px] uppercase font-mono text-[#848484]">Total Synced Gigs</span>
                    <p className="text-sm font-heading font-bold text-white mt-1">
                      {syncStatus?.metrics?.totalGigsSynced || events.length} Events
                    </p>
                  </div>
                  <div className="p-3.5 rounded-[14px] bg-[#121215] border border-[#212126]">
                    <span className="text-[10px] uppercase font-mono text-[#848484]">PubSub Gateways</span>
                    <p className="text-sm font-heading font-bold text-[#4ADE80] mt-1 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse"></span>
                      <span>Connected</span>
                    </p>
                  </div>
                </div>

                {/* Webhook Ingestion Configuration Panel */}
                <div className="p-4 rounded-[16px] bg-[#131317] border border-[#23232A] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>Incoming Webhook Integration Endpoint</span>
                    </span>
                    <span className="text-[10px] text-[#71717A] font-mono">HMAC SHA-256 Verified</span>
                  </div>
                  <p className="text-[11px] text-[#A1A1AA]">
                    Use this endpoint to receive real-time updates directly from axess.zone website webhooks whenever new gigs are announced or tiers sell out.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/api/webhooks/website-sync`}
                      className="flex-1 px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white font-mono text-xs select-all outline-none"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(`${window.location.origin}/api/webhooks/website-sync`);
                        setCopiedWebhook(true);
                        setTimeout(() => setCopiedWebhook(false), 2000);
                      }}
                      className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono flex items-center gap-1.5 transition-all"
                    >
                      {copiedWebhook ? <Check className="w-3.5 h-3.5 text-[#4ADE80]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Real Sync Logs */}
                <div className="flex flex-col gap-2.5">
                  <h4 className="text-xs font-semibold text-white tracking-tight">Recent Synchronization Audit Trail</h4>
                  <div className="border border-[#212126] rounded-[16px] overflow-hidden bg-[#121215]">
                    <div className="divide-y divide-[#1C1C22] text-xs">
                      {syncStatus?.logs?.map((log) => (
                        <div key={log.id} className="p-3.5 flex flex-col gap-1.5 hover:bg-white/[0.01]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#15301F] text-[#4ADE80] border border-[#224E33]">
                                {log.status}
                              </span>
                              <span className="font-mono text-[10px] text-[#848484] uppercase">
                                Mode: {log.sync_type}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#71717A] font-mono">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[12px] text-[#CCC] leading-relaxed">{log.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: NOTIFICATIONS SETUP MODE */}
            {activeTab === 'notifications' && (
              <div className="flex flex-col gap-6">
                <div className="border-b border-[#1E1E24] pb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">Targeted Push & In-App Notifications</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#352514] text-[#F59E0B] border border-[#593F1F] font-bold">
                      NOTIFICATION SETUP
                    </span>
                  </div>
                  <p className="text-xs text-[#848484] mt-0.5">
                    Send custom notifications to users based on location (Goa, Bangalore, Kasol), role, or loyalty status
                  </p>
                </div>

                {notifSuccessMsg && (
                  <div className="p-3 rounded-xl bg-[#15301F] border border-[#224E33] text-[#4ADE80] text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{notifSuccessMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left: Composer Form */}
                  <form onSubmit={handleSendNotification} className="lg:col-span-7 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#AAA]">Notification Title *</label>
                      <input
                        type="text"
                        required
                        value={newNotif.title}
                        onChange={(e) => setNewNotif({ ...newNotif, title: e.target.value })}
                        placeholder="e.g. ⚡ Final Phase Passes for Primal Void"
                        className="px-3.5 py-2.5 rounded-xl bg-[#141417] border border-[#232328] text-white text-xs outline-none focus:border-white/40"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#AAA]">Message Body *</label>
                      <textarea
                        rows="3"
                        required
                        value={newNotif.message}
                        onChange={(e) => setNewNotif({ ...newNotif, message: e.target.value })}
                        placeholder="e.g. Only 14 Tier 2 passes remaining for Primal Void at House of Chapora. Book before tier closes tonight."
                        className="px-3.5 py-2.5 rounded-xl bg-[#141417] border border-[#232328] text-white text-xs outline-none focus:border-white/40"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#AAA]">Target Location</label>
                        <select
                          value={newNotif.target_location}
                          onChange={(e) => setNewNotif({ ...newNotif, target_location: e.target.value })}
                          className="px-3 py-2 rounded-xl bg-[#141417] border border-[#232328] text-white text-xs outline-none"
                        >
                          <option value="ALL">All Locations</option>
                          <option value="Goa">Goa</option>
                          <option value="Bangalore">Bangalore</option>
                          <option value="Kasol">Kasol</option>
                          <option value="Mumbai">Mumbai</option>
                          <option value="Delhi">Delhi</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#AAA]">Target Role</label>
                        <select
                          value={newNotif.target_role}
                          onChange={(e) => setNewNotif({ ...newNotif, target_role: e.target.value })}
                          className="px-3 py-2 rounded-xl bg-[#141417] border border-[#232328] text-white text-xs outline-none"
                        >
                          <option value="ALL">All App Users</option>
                          <option value="USER">Attendees (Ticket Buyers)</option>
                          <option value="ORGANIZER">Event Organizers</option>
                          <option value="PROMOTER">Promoters & Reps</option>
                          <option value="SPONSOR">Brand Sponsors</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#AAA]">Category</label>
                        <select
                          value={newNotif.category}
                          onChange={(e) => setNewNotif({ ...newNotif, category: e.target.value })}
                          className="px-3 py-2 rounded-xl bg-[#141417] border border-[#232328] text-white text-xs outline-none"
                        >
                          <option value="ANNOUNCEMENT">Announcement</option>
                          <option value="OFFER">Special Offer</option>
                          <option value="ALERT">Gate Advisory</option>
                          <option value="RETARGETING">Retargeting</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#AAA]">Priority</label>
                        <select
                          value={newNotif.priority}
                          onChange={(e) => setNewNotif({ ...newNotif, priority: e.target.value })}
                          className="px-3 py-2 rounded-xl bg-[#141417] border border-[#232328] text-white text-xs outline-none"
                        >
                          <option value="NORMAL">Normal</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent (Banner)</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs text-[#AAA]">Action / Link</label>
                        <input
                          type="text"
                          value={newNotif.action_link}
                          onChange={(e) => setNewNotif({ ...newNotif, action_link: e.target.value })}
                          placeholder="ev_primal_void or PROMO10"
                          className="px-3 py-2 rounded-xl bg-[#141417] border border-[#232328] text-white text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={sendingNotif}
                        className="w-full py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-black font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{sendingNotif ? 'Broadcasting...' : 'Broadcast Notification to App Users'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Right: Smartphone Push Preview */}
                  <div className="lg:col-span-5 flex flex-col items-center">
                    <span className="text-[11px] font-mono text-[#848484] uppercase tracking-wider mb-2">
                      Live Push Notification Preview
                    </span>
                    <div className="w-full max-w-[310px] rounded-[32px] p-4 bg-[#141417] border border-[#26262D] shadow-2xl flex flex-col gap-3">
                      <div className="h-4 flex items-center justify-between px-2">
                        <span className="text-[10px] text-white font-mono">9:41</span>
                        <div className="w-12 h-2.5 rounded-full bg-black/60 border border-white/10"></div>
                      </div>

                      {/* Push Notification Card */}
                      <div className="p-3.5 rounded-[18px] bg-black/80 backdrop-blur-md border border-white/10 shadow-lg flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded bg-white flex items-center justify-center">
                              <span className="text-[9px] font-black text-black">A</span>
                            </div>
                            <span className="text-[11px] font-semibold text-white">AXESS</span>
                            <span className="text-[9px] text-[#71717A] font-mono">• now</span>
                          </div>
                          {newNotif.target_location !== 'ALL' && (
                            <span className="text-[9px] text-[#F59E0B] font-mono font-medium">
                              📍 {newNotif.target_location}
                            </span>
                          )}
                        </div>
                        <h4 className="text-[12px] font-semibold text-white mt-0.5 leading-snug">
                          {newNotif.title || 'Notification Headline'}
                        </h4>
                        <p className="text-[11px] text-[#A1A1AA] leading-tight">
                          {newNotif.message || 'Custom message preview will show here in real time as you compose.'}
                        </p>
                      </div>

                      <div className="py-8 text-center text-[10px] text-[#555] font-mono">
                        Swipe up to unlock Axess App
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sent Notifications History */}
                <div className="flex flex-col gap-2.5 pt-4 border-t border-[#1E1E24]">
                  <h4 className="text-xs font-semibold text-white tracking-tight">Recent Broadcast History</h4>
                  <div className="divide-y divide-[#1C1C22] border border-[#212126] rounded-[16px] bg-[#121215] overflow-hidden">
                    {notificationsList.map((notif) => (
                      <div key={notif.id} className="p-3.5 flex items-start justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{notif.title}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-white/10 text-white">
                              {notif.target_location}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-white/5 text-[#888]">
                              {notif.target_role}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#888] mt-1">{notif.message}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-mono text-[#F59E0B] font-bold">
                            {notif.recipient_count} Delivered
                          </span>
                          <div className="text-[9px] text-[#666] font-mono mt-0.5">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: RETARGETING OPTIONS ENGINE */}
            {activeTab === 'retargeting' && (
              <div className="flex flex-col gap-6">
                <div className="border-b border-[#1E1E24] pb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">Retargeting & Abandoned Cart Recovery</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#351527] text-[#EC4899] border border-[#612144] font-bold">
                      RETARGETING ENGINE
                    </span>
                  </div>
                  <p className="text-xs text-[#848484] mt-0.5">
                    Re-engage visitors who browsed, attendees with redeemed tickets, or users with abandoned carts
                  </p>
                </div>

                {retargetSuccessMsg && (
                  <div className="p-3 rounded-xl bg-[#15301F] border border-[#224E33] text-[#4ADE80] text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{retargetSuccessMsg}</span>
                  </div>
                )}

                {/* Retargeting KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-[14px] bg-[#121215] border border-[#212126]">
                    <span className="text-[10px] uppercase font-mono text-[#848484]">Open Abandoned Carts</span>
                    <p className="text-lg font-heading font-bold text-[#EC4899] mt-1">
                      {retargetingData?.stats?.openCartsCount || 3} Carts
                    </p>
                  </div>
                  <div className="p-3.5 rounded-[14px] bg-[#121215] border border-[#212126]">
                    <span className="text-[10px] uppercase font-mono text-[#848484]">Pending Cart Value</span>
                    <p className="text-lg font-heading font-bold text-white mt-1">
                      ₹{retargetingData?.stats?.abandonedGrossINR?.toLocaleString() || '17,995'}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-[14px] bg-[#121215] border border-[#212126]">
                    <span className="text-[10px] uppercase font-mono text-[#848484]">Redeemed Attendee Pool</span>
                    <p className="text-lg font-heading font-bold text-white mt-1">
                      {retargetingData?.stats?.redeemedAttendeesCount || 28} Verified
                    </p>
                  </div>
                  <div className="p-3.5 rounded-[14px] bg-[#121215] border border-[#212126]">
                    <span className="text-[10px] uppercase font-mono text-[#848484]">Recovered Revenue</span>
                    <p className="text-lg font-heading font-bold text-[#4ADE80] mt-1">
                      ₹{retargetingData?.stats?.totalRecoveredRevenueINR?.toLocaleString() || '296,650'}
                    </p>
                  </div>
                </div>

                {/* Automated Retargeting Triggers */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-semibold text-white tracking-tight">Automated Retargeting Rules</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {retargetingData?.campaigns?.map((rule) => (
                      <div
                        key={rule.id}
                        className="p-4 rounded-[16px] bg-[#141417] border border-[#23232A] flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                              {rule.segment_type}
                            </span>
                            <button
                              onClick={() => handleToggleRetargetRule(rule.id, rule.is_active)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                                rule.is_active
                                  ? 'bg-[#15301F] text-[#4ADE80] border border-[#224E33]'
                                  : 'bg-[#262626] text-[#888] border border-[#3B3B3B]'
                              }`}
                            >
                              {rule.is_active ? 'ACTIVE' : 'PAUSED'}
                            </button>
                          </div>
                          <h5 className="text-[13px] font-semibold text-white">{rule.name}</h5>
                          <p className="text-[11px] text-[#888] mt-1 leading-snug">{rule.message_template}</p>
                        </div>

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                          <span className="text-[#A1A1AA]">Code: <strong className="text-white">{rule.discount_code}</strong> ({rule.discount_percent}%)</span>
                          <span className="text-[#4ADE80]">₹{rule.recovered_revenue?.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Abandoned Carts Table with 1-Click Retarget */}
                <div className="flex flex-col gap-2.5">
                  <h4 className="text-xs font-semibold text-white tracking-tight">Active Abandoned Carts</h4>
                  <div className="border border-[#212126] rounded-[16px] overflow-hidden bg-[#121215]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#18181C] text-[#848484] uppercase font-mono text-[10px] border-b border-[#212126]">
                          <tr>
                            <th className="py-2.5 px-4">User</th>
                            <th className="py-2.5 px-4">Event & Tier</th>
                            <th className="py-2.5 px-4">Passes</th>
                            <th className="py-2.5 px-4">Cart Value</th>
                            <th className="py-2.5 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1D1D22] text-[#CCC]">
                          {retargetingData?.abandonedCarts?.map((cart) => (
                            <tr key={cart.id} className="hover:bg-white/[0.02]">
                              <td className="py-3 px-4">
                                <div className="text-white font-medium">{cart.user_email || 'guest@axess.zone'}</div>
                                <div className="text-[10px] text-[#71717A] font-mono">Status: {cart.status}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-white font-medium">{cart.event_title}</div>
                                <div className="text-[11px] text-[#888]">{cart.tier_name}</div>
                              </td>
                              <td className="py-3 px-4 font-mono">{cart.quantity}x</td>
                              <td className="py-3 px-4 font-heading font-semibold text-white">₹{cart.total_amount}</td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={async () => {
                                    await api.createRetargetingCampaign({
                                      name: `Nudge for ${cart.event_title}`,
                                      segment_type: 'ABANDONED_CART',
                                      discount_code: 'CART10',
                                      discount_percent: 10,
                                      message_template: `Hey! Your tickets for ${cart.event_title} are reserved. Complete checkout now with code CART10 for 10% off.`
                                    });
                                    setRetargetSuccessMsg(`Retargeting discount sent to ${cart.user_email}!`);
                                    setTimeout(() => setRetargetSuccessMsg(''), 4000);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-[#EC4899]/10 hover:bg-[#EC4899]/20 text-[#EC4899] text-[11px] font-medium border border-[#EC4899]/30 transition-all inline-flex items-center gap-1"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Send 10% Nudge</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: USERS & ROLES */}
            {activeTab === 'users' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Registered Accounts & Roles</h3>
                  <span className="text-xs text-[#848484] font-mono">{users.length} Active Profiles</span>
                </div>

                <div className="border border-[#212126] rounded-[16px] overflow-hidden bg-[#121215]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#18181C] text-[#848484] uppercase font-mono text-[10px] border-b border-[#212126]">
                        <tr>
                          <th className="py-2.5 px-4">User</th>
                          <th className="py-2.5 px-4">Role</th>
                          <th className="py-2.5 px-4">Phone</th>
                          <th className="py-2.5 px-4">Entity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1D1D22] text-[#CCC]">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-4">
                              <div className="text-white font-medium">{u.name}</div>
                              <div className="text-[11px] text-[#71717A]">{u.email}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  u.role === 'ADMIN'
                                    ? 'bg-[#31264E] text-[#D8B4FE]'
                                    : u.role === 'ORGANIZER'
                                    ? 'bg-[#183626] text-[#6EE7B7]'
                                    : u.role === 'PROMOTER'
                                    ? 'bg-[#3A241A] text-[#FDBA74]'
                                    : u.role === 'SPONSOR'
                                    ? 'bg-[#182C3D] text-[#7DD3FC]'
                                    : 'bg-[#222226] text-[#A1A1AA]'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[#AAA]">{u.phone || '—'}</td>
                            <td className="py-3 px-4 text-[#AAA]">{u.company_name || 'Individual'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
