import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { X, Copy, Check, TrendingUp, DollarSign, Tag, Plus } from 'lucide-react';

export default function PromoterPortal({ onClose }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // New Code Form
  const [newCode, setNewCode] = useState('');
  const [discountVal, setDiscountVal] = useState(10);
  const [creating, setCreating] = useState(false);

  const loadData = () => {
    setLoading(true);
    api.getPromoterDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyLink = (code) => {
    const link = `${window.location.origin}?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateCode = async (e) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    setCreating(true);
    try {
      await api.createPromoterCode({
        code: newCode.trim(),
        discountVal: parseInt(discountVal, 10),
        discountType: 'PERCENT'
      });
      setNewCode('');
      loadData();
    } catch (err) {
      alert(`Error creating code: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#111111] border border-[#212121] rounded-[20px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="h-14 px-5 border-b border-[#212121] flex items-center justify-between shrink-0 bg-[#111111]">
          <div className="flex items-center gap-2">
            <span className="font-heading text-[14px] font-semibold text-white tracking-wide">
              Promoter Partner Dashboard
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            <span className="text-[11px] font-mono text-[#848484]">{user?.name || 'RaveConnect Goa'}</span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1c1c1c] border border-[#2e2e2e] hover:border-white/40 text-[#848484] hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {loading || !data ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2 text-[#848484]">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[12px] font-mono">Loading promoter analytics & commissions...</p>
          </div>
        ) : (
          <div className="p-5 sm:p-6 overflow-y-auto max-h-[80vh] flex flex-col gap-6">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-[12px] bg-[#161616] border border-[#212121]">
                <span className="text-[10px] uppercase font-mono text-[#606060]">Attributed Orders</span>
                <p className="font-heading text-[20px] font-semibold text-white mt-1">{data.summary.totalOrders}</p>
              </div>

              <div className="p-3.5 rounded-[12px] bg-[#161616] border border-[#212121]">
                <span className="text-[10px] uppercase font-mono text-[#606060]">Gross Volume</span>
                <p className="font-heading text-[20px] font-semibold text-white mt-1">₹{data.summary.grossSales?.toLocaleString()}</p>
              </div>

              <div className="p-3.5 rounded-[12px] bg-[#161616] border border-[#212121]">
                <span className="text-[10px] uppercase font-mono text-[#606060]">Commission Earned</span>
                <p className="font-heading text-[20px] font-semibold text-white mt-1">₹{data.summary.earnedCommission?.toLocaleString()}</p>
              </div>

              <div className="p-3.5 rounded-[12px] bg-[#161616] border border-[#212121]">
                <span className="text-[10px] uppercase font-mono text-[#606060]">Rate</span>
                <p className="font-heading text-[20px] font-semibold text-white mt-1">{data.summary.commissionRate}</p>
              </div>
            </div>

            {/* Primary Referral Link Copy Box */}
            <div className="p-4 rounded-[12px] bg-[#161616] border border-[#212121] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase font-mono text-[#606060]">Your Master Affiliate Code</p>
                <p className="font-mono text-[16px] font-bold text-white mt-0.5">{data.summary.referralCode}</p>
                <p className="text-[11px] text-[#848484] font-body mt-1">
                  Share this code with your community for 10% off ticket checkout.
                </p>
              </div>

              <button
                onClick={() => handleCopyLink(data.summary.referralCode)}
                className="h-8 px-4 rounded-[20px] bg-white text-black font-heading text-[12px] font-medium hover:bg-[#e0e0e0] active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-black" />
                    <span>Link Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-black" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Create New Promo Code Form */}
            <form onSubmit={handleCreateCode} className="p-4 rounded-[12px] bg-[#161616] border border-[#212121] flex flex-col gap-3">
              <h4 className="font-heading text-[14px] font-semibold text-white">Generate Custom Promo Code</h4>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. VIPTECHNO"
                  className="w-full sm:flex-1 h-9 px-3 rounded-[10px] bg-[#0d0d0d] border border-[#262626] focus:border-white text-white text-[12px] font-mono uppercase outline-none"
                  required
                />
                <select
                  value={discountVal}
                  onChange={(e) => setDiscountVal(e.target.value)}
                  className="w-full sm:w-32 h-9 px-2 rounded-[10px] bg-[#0d0d0d] border border-[#262626] text-white text-[12px] font-mono outline-none"
                >
                  <option value={5}>5% Off</option>
                  <option value={10}>10% Off</option>
                  <option value={15}>15% Off</option>
                  <option value={20}>20% Off</option>
                </select>
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full sm:w-auto h-9 px-4 rounded-[20px] bg-[#1c1c1c] border border-[#2e2e2e] hover:border-white/40 text-white font-heading text-[12px] font-medium disabled:opacity-40 transition-all"
                >
                  {creating ? 'Creating...' : 'Create Code'}
                </button>
              </div>
            </form>

            {/* Attributed Orders History Table */}
            <div className="flex flex-col gap-2">
              <h4 className="font-heading text-[14px] font-semibold text-white">Attributed Ticket Transactions</h4>
              {data.orders.length === 0 ? (
                <p className="text-[12px] text-[#606060] font-mono py-4 text-center">No attributed sales yet.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {data.orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3 rounded-[10px] bg-[#161616] border border-[#212121] flex items-center justify-between text-[12px]"
                    >
                      <div>
                        <span className="font-mono font-bold text-white">{ord.order_number}</span>
                        <span className="text-[#848484] ml-2 font-heading">{ord.event_title}</span>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <span className="font-mono text-[#848484]">Order: ₹{ord.final_amount?.toLocaleString()}</span>
                        <span className="font-mono font-bold text-white">+₹{ord.commission_earned} cut</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}