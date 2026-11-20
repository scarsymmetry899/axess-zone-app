import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { X, Ticket, Calendar, MapPin, Printer, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function TicketsWalletModal({ onClose }) {
  const { user, isAuthenticated, switchRole } = useAuth();
  const { socket } = useSocket();
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('passes'); // 'passes' or 'orders'
  const [selectedTicket, setSelectedTicket] = useState(null);

  const loadTickets = () => {
    if (!isAuthenticated) {
      switchRole('USER');
      return;
    }
    setLoading(true);
    api.getMyTickets()
      .then((res) => {
        setTickets(res.tickets || []);
        setOrders(res.orders || []);
        if (res.tickets && res.tickets.length > 0) {
          setSelectedTicket(res.tickets[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTickets();
  }, [isAuthenticated, user?.id]);

  // Real-time update when gate checks in the ticket
  useEffect(() => {
    const handleGateCheckIn = (data) => {
      if (data?.checkInResult?.ticket?.ticket_code) {
        setTickets((prev) =>
          prev.map((t) =>
            t.ticket_code === data.checkInResult.ticket.ticket_code
              ? { ...t, status: 'CHECKED_IN', checked_in_at: data.checkInResult.admittedAt }
              : t
          )
        );
      }
    };

    if (socket) {
      socket.on('gate:checkin', handleGateCheckIn);
      return () => socket.off('gate:checkin', handleGateCheckIn);
    }
  }, [socket]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#111111] border border-[#212121] rounded-[20px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="h-14 px-5 border-b border-[#212121] flex items-center justify-between shrink-0 bg-[#111111]">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-white" />
            <h3 className="font-heading text-[15px] font-semibold text-white tracking-wide">
              Your Tickets Wallet
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-[#1c1c1c] border border-[#2e2e2e] hover:border-white/40 text-[#848484] hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Not Logged In State */}
        {!isAuthenticated ? (
          <div className="p-12 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#161616] border border-[#212121] flex items-center justify-center text-white">
              <Ticket className="w-6 h-6 text-[#848484]" />
            </div>
            <div>
              <h4 className="font-heading text-[18px] font-semibold text-white">Access Your Digital Passes</h4>
              <p className="text-[12px] text-[#848484] font-body mt-1 max-w-sm">
                Login with your Attendee account to access your live encrypted QR entry passes and order history.
              </p>
            </div>
            <button
              onClick={() => switchRole('USER')}
              className="h-10 px-6 rounded-[20px] bg-white text-black font-heading text-[13px] font-semibold hover:bg-[#e0e0e0] active:scale-95 transition-all shadow-sm"
            >
              Sign In as Attendee (Arjun Patel)
            </button>
          </div>
        ) : loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2 text-[#848484]">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[12px] font-mono">Synchronizing cryptographic passes...</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Wallet Tabs */}
            <div className="flex border-b border-[#212121] px-5 bg-[#141414]">
              <button
                onClick={() => setActiveTab('passes')}
                className={`py-3 px-3 text-[13px] font-heading font-semibold border-b-2 transition-all ${
                  activeTab === 'passes'
                    ? 'border-white text-white'
                    : 'border-transparent text-[#606060] hover:text-[#848484]'
                }`}
              >
                Active Passes ({tickets.length})
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-3 px-3 text-[13px] font-heading font-semibold border-b-2 transition-all ${
                  activeTab === 'orders'
                    ? 'border-white text-white'
                    : 'border-transparent text-[#606060] hover:text-[#848484]'
                }`}
              >
                Order History ({orders.length})
              </button>
            </div>

            {/* Passes Tab */}
            {activeTab === 'passes' && (
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-6">
                {tickets.length === 0 ? (
                  <div className="p-12 text-center text-[#848484] flex flex-col items-center justify-center gap-2">
                    <p className="font-heading text-white font-semibold">No active passes in your wallet.</p>
                    <p className="text-[12px] font-body">Explore live events and book tickets to have them appear here.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {tickets.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-[16px] bg-[#161616] border border-[#212121] overflow-hidden flex flex-col md:flex-row shadow-lg transition-all"
                      >
                        {/* Left Stub: Event Information */}
                        <div className="flex-1 p-5 flex flex-col justify-between gap-4">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2.5 py-0.5 rounded-[12px] bg-[#111111] border border-[#212121] text-[#848484] text-[10px] font-mono uppercase">
                                {t.tier_name}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-[12px] text-[10px] font-mono uppercase ${
                                  t.status === 'VALID'
                                    ? 'bg-white text-black font-semibold'
                                    : t.status === 'CHECKED_IN'
                                    ? 'bg-[#1c1c1c] border border-white/40 text-white'
                                    : 'bg-red-950/40 border border-red-800 text-red-400'
                                }`}
                              >
                                {t.status === 'CHECKED_IN' ? 'Admitted / Checked In' : t.status}
                              </span>
                            </div>

                            <h4 className="font-heading text-[19px] sm:text-[21px] font-semibold text-white tracking-tight mt-2">
                              {t.event_title}
                            </h4>
                            {t.event_subtitle && (
                              <p className="text-[11px] text-[#848484] font-body">
                                {t.event_subtitle}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-1.5 text-[12px] text-[#848484] border-t border-[#212121] pt-3 font-body">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-[#606060] shrink-0" />
                              <span>{t.date_display}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-[#606060] shrink-0" />
                              <span className="truncate">{t.venue_name}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#606060] font-mono border-t border-[#212121] pt-2">
                            <span>Attendee: {t.attendee_name}</span>
                            <span>Order: {t.order_number}</span>
                          </div>
                        </div>

                        {/* Right Stub: Scannable QR Pass */}
                        <div className="w-full md:w-56 bg-[#131313] border-t md:border-t-0 md:border-l border-[#212121] p-5 flex flex-col items-center justify-center gap-3">
                          <div className="p-3 bg-white rounded-[12px] shadow-sm">
                            <QRCodeSVG
                              value={t.qr_payload || t.ticket_code}
                              size={120}
                              level="H"
                              includeMargin={false}
                            />
                          </div>

                          <div className="text-center">
                            <span className="text-[11px] font-mono font-bold text-white tracking-wider block">
                              {t.ticket_code}
                            </span>
                            <span className="text-[9px] text-[#606060] font-mono block mt-0.5">
                              SCAN AT GUESTLIST / GATE DESK
                            </span>
                          </div>

                          <button
                            onClick={() => window.print()}
                            className="text-[10px] text-[#848484] hover:text-white flex items-center gap-1 font-heading transition-colors"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Print / Save PDF</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-3">
                {orders.length === 0 ? (
                  <p className="text-center text-[#848484] text-sm py-8 font-body">No previous orders on record.</p>
                ) : (
                  orders.map((o) => (
                    <div
                      key={o.id}
                      className="p-4 rounded-[12px] bg-[#161616] border border-[#212121] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading text-[14px] font-semibold text-white">{o.order_number}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-[10px] bg-white text-black font-semibold uppercase">
                            {o.payment_status}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#848484] mt-1 font-body">
                          {o.created_at} • {o.currency} {o.final_amount.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveTab('passes')}
                          className="h-8 px-4 rounded-[20px] bg-white text-black font-heading text-[12px] font-medium hover:bg-[#e0e0e0] transition-colors"
                        >
                          View Passes
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}