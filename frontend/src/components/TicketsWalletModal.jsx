import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { X, Ticket, Calendar, MapPin, Printer, ShieldCheck, CheckCircle2, ArrowRightLeft, Lock, Send, AlertTriangle } from 'lucide-react';

export default function TicketsWalletModal({ onClose }) {
  const { user, isAuthenticated, switchRole } = useAuth();
  const { socket } = useSocket();
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('passes'); // 'passes' or 'orders'
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Transfer Ticket Modal state
  const [transferTargetTicket, setTransferTargetTicket] = useState(null);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferName, setTransferName] = useState('');
  const [transferPhone, setTransferPhone] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferSuccessMsg, setTransferSuccessMsg] = useState('');

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

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferEmail) {
      alert('Please provide recipient email.');
      return;
    }
    setTransferring(true);
    try {
      const res = await api.transferTicket(transferTargetTicket.id, {
        recipientEmail: transferEmail,
        recipientName: transferName,
        recipientPhone: transferPhone
      });
      setTransferSuccessMsg(res.message || 'Ticket pass transferred successfully!');
      setTimeout(() => {
        setTransferSuccessMsg('');
        setTransferTargetTicket(null);
        setTransferEmail('');
        setTransferName('');
        setTransferPhone('');
        loadTickets();
      }, 2500);
    } catch (err) {
      alert(`Transfer failed: ${err.message}`);
    } finally {
      setTransferring(false);
    }
  };

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

                        {/* Right Stub: Scannable QR Pass or Transferred State */}
                        <div className="w-full md:w-56 bg-[#131313] border-t md:border-t-0 md:border-l border-[#212121] p-5 flex flex-col items-center justify-center gap-3">
                          {t.status === 'TRANSFERRED' ? (
                            <div className="p-4 bg-[#181820] border border-[#2E2E38] rounded-[14px] text-center flex flex-col items-center gap-2">
                              <Lock className="w-7 h-7 text-[#A855F7]" />
                              <span className="text-[11px] font-semibold text-white">Transferred</span>
                              <span className="text-[10px] text-[#888] leading-tight">
                                Pass custody transferred to recipient. Original QR revoked.
                              </span>
                            </div>
                          ) : (
                            <>
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
                            </>
                          )}

                          <div className="flex items-center gap-3 pt-1">
                            <button
                              onClick={() => window.print()}
                              className="text-[10px] text-[#848484] hover:text-white flex items-center gap-1 font-heading transition-colors"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Print</span>
                            </button>

                            {t.status === 'VALID' && (
                              <button
                                onClick={() => setTransferTargetTicket(t)}
                                className="text-[10px] text-[#A855F7] hover:text-[#C084FC] flex items-center gap-1 font-heading transition-colors font-semibold"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                                <span>Transfer</span>
                              </button>
                            )}
                          </div>
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

        {/* Peer-to-Peer Transfer Dialog (District/DICE Anti-Fraud Mechanism) */}
        {transferTargetTicket && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#131317] border border-[#2B2B36] rounded-[20px] shadow-2xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#28183D] border border-[#502E7A] flex items-center justify-center">
                    <ArrowRightLeft className="w-4 h-4 text-[#C084FC]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Transfer Ticket Pass</h4>
                    <p className="text-[11px] text-[#888] font-mono">{transferTargetTicket.ticket_code}</p>
                  </div>
                </div>
                <button
                  onClick={() => setTransferTargetTicket(null)}
                  className="w-7 h-7 rounded-full bg-[#1F1F26] text-[#888] hover:text-white flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {transferSuccessMsg ? (
                <div className="py-6 flex flex-col items-center text-center gap-2 animate-in zoom-in-95">
                  <CheckCircle2 className="w-10 h-10 text-[#4ADE80]" />
                  <h5 className="text-sm font-semibold text-white">Custody Handed Over</h5>
                  <p className="text-xs text-[#888]">{transferSuccessMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleTransferSubmit} className="flex flex-col gap-3.5">
                  <div className="p-3 rounded-xl bg-[#1C182A] border border-[#3A2859] flex items-start gap-2.5 text-xs text-[#D8B4FE]">
                    <AlertTriangle className="w-4 h-4 text-[#C084FC] shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      <strong>District / DICE Anti-Duplication Safeguard:</strong> Once confirmed, this ticket’s QR code will be permanently revoked from your wallet. A fresh cryptographic pass will be assigned directly to the recipient.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#AAA]">Recipient Email Address *</label>
                    <input
                      type="email"
                      required
                      value={transferEmail}
                      onChange={(e) => setTransferEmail(e.target.value)}
                      placeholder="friend@axess.zone"
                      className="px-3.5 py-2.5 rounded-xl bg-[#0D0D10] border border-[#26262F] text-white text-xs outline-none focus:border-white/40"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#AAA]">Recipient Name</label>
                      <input
                        type="text"
                        value={transferName}
                        onChange={(e) => setTransferName(e.target.value)}
                        placeholder="e.g. Maya Sen"
                        className="px-3.5 py-2 rounded-xl bg-[#0D0D10] border border-[#26262F] text-white text-xs outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#AAA]">Phone (Optional)</label>
                      <input
                        type="tel"
                        value={transferPhone}
                        onChange={(e) => setTransferPhone(e.target.value)}
                        placeholder="+91 98765 00000"
                        className="px-3.5 py-2 rounded-xl bg-[#0D0D10] border border-[#26262F] text-white text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setTransferTargetTicket(null)}
                      className="px-4 py-2 rounded-xl border border-white/10 text-white text-xs hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={transferring}
                      className="px-4 py-2 rounded-xl bg-[#A855F7] hover:bg-[#A855F7]/90 text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{transferring ? 'Transferring Custody...' : 'Confirm Transfer'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}