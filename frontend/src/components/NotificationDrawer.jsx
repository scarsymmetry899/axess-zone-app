import React, { useState, useEffect } from 'react';
import { X, Bell, MapPin, Tag, AlertTriangle, Sparkles, Check, ExternalLink } from 'lucide-react';
import { api } from '../api/client.js';

export default function NotificationDrawer({ isOpen, onClose, onSelectEvent, onApplyPromo }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLocationFilter, setActiveLocationFilter] = useState('ALL');
  const [copiedCode, setCopiedCode] = useState(null);

  const loadNotifications = () => {
    setLoading(true);
    api.getNotifications({ location: activeLocationFilter })
      .then((res) => {
        if (res.notifications) {
          setNotifications(res.notifications);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, activeLocationFilter]);

  if (!isOpen) return null;

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    if (onApplyPromo) onApplyPromo(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const filtered = activeLocationFilter === 'ALL'
    ? notifications
    : notifications.filter((n) => n.target_location === 'ALL' || n.target_location?.toLowerCase() === activeLocationFilter.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-[#0A0A0C] border-l border-[#212121] shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#1E1E24] flex items-center justify-between shrink-0 bg-[#0D0D10]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#161619] border border-[#26262A] flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-white tracking-tight flex items-center gap-2">
                <span>Notifications & Drops</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/10 text-white font-bold">
                  {filtered.length}
                </span>
              </h2>
              <p className="text-[11px] text-[#71717A]">
                Location advisories, flash releases & loyalty perks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="w-8 h-8 rounded-full bg-[#161619] border border-[#262629] hover:border-white/40 text-[#888] hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Location Filter Chips */}
        <div className="px-5 py-3 border-b border-[#1A1A1F] flex items-center gap-2 overflow-x-auto bg-[#0A0A0C]">
          {['ALL', 'Goa', 'Bangalore', 'Kasol'].map((loc) => (
            <button
              key={loc}
              onClick={() => setActiveLocationFilter(loc)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all shrink-0 ${
                activeLocationFilter === loc
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'bg-[#141417] text-[#888] hover:text-white border border-[#212124]'
              }`}
            >
              {loc === 'ALL' ? 'All Locations' : loc}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5 custom-scrollbar">
          {loading ? (
            <div className="py-12 text-center text-[#71717A] text-xs font-mono">
              Fetching live updates...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#141416] border border-[#242428] flex items-center justify-center mx-auto mb-3">
                <Bell className="w-5 h-5 text-[#555]" />
              </div>
              <p className="text-white text-sm font-medium">All caught up!</p>
              <p className="text-[#71717A] text-xs mt-1">No pending notifications for this location.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const isUrgent = item.priority === 'URGENT';
              const isOffer = item.category === 'OFFER' || item.category === 'RETARGETING';

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-[16px] border transition-all ${
                    isUrgent
                      ? 'bg-[#1C1313] border-[#4A2020]'
                      : isOffer
                      ? 'bg-[#111915] border-[#223B2A]'
                      : 'bg-[#141417] border-[#222329]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase ${
                        isUrgent
                          ? 'bg-[#4B1B1B] text-[#FF8585]'
                          : isOffer
                          ? 'bg-[#173822] text-[#4ADE80]'
                          : 'bg-[#22222A] text-[#A1A1AA]'
                      }`}>
                        {item.category || 'ANNOUNCEMENT'}
                      </span>
                      {item.target_location && item.target_location !== 'ALL' && (
                        <span className="flex items-center gap-1 text-[10px] text-[#A1A1AA] bg-black/40 px-2 py-0.5 rounded border border-white/5 font-mono">
                          <MapPin className="w-2.5 h-2.5 text-[#888]" />
                          {item.target_location}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#71717A] font-mono shrink-0">
                      {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                    </span>
                  </div>

                  <h3 className="text-[13px] font-semibold text-white leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-[12px] text-[#A1A1AA] mt-1.5 leading-relaxed">
                    {item.message}
                  </p>

                  {/* Action row */}
                  {item.action_link && (
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                      {item.action_link.startsWith('ev_') ? (
                        <button
                          onClick={() => {
                            if (onSelectEvent) onSelectEvent(item.action_link);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 text-[11px] font-medium text-white hover:text-white/80 transition-colors"
                        >
                          <span>Explore Gig Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCopyCode(item.action_link)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-mono transition-all"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{copiedCode === item.action_link ? 'Copied & Applied!' : `Use Code ${item.action_link}`}</span>
                          {copiedCode === item.action_link && <Check className="w-3 h-3 text-[#4ADE80]" />}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1C1C22] bg-[#0A0A0C] shrink-0 text-center">
          <p className="text-[11px] text-[#606066]">
            Real-time synchronization with axess.zone gateway
          </p>
        </div>
      </div>
    </div>
  );
}
