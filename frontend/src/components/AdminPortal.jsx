import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { X, ShieldCheck, RefreshCw, Radio } from 'lucide-react';

export default function AdminPortal({ onClose }) {
  const { user } = useAuth();
  const { connected } = useSocket();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([api.getAdminOverview(), api.getAdminUsers()])
      .then(([overRes, userRes]) => {
        setOverview(overRes);
        setUsers(userRes.users || []);
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
        message: 'Upstream Axess website sync trigger executed by Platform Admin'
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#111111] border border-[#212121] rounded-[20px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="h-14 px-5 border-b border-[#212121] flex items-center justify-between shrink-0 bg-[#111111]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-white" />
            <span className="font-heading text-[14px] font-semibold text-white tracking-wide">
              Axess Platform Oversight & Admin Engine
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1c1c1c] border border-[#2e2e2e] hover:border-white/40 text-[#848484] hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {loading || !overview ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2 text-[#848484]">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[12px] font-mono">Aggregating platform metrics...</p>
          </div>
        ) : (
          <div className="p-5 sm:p-6 overflow-y-auto max-h-[80vh] flex flex-col gap-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-[12px] bg-[#161616] border border-[#212121]">
                <span className="text-[10px] uppercase font-mono text-[#606060]">Gross Ticket Volume</span>
                <p className="font-heading text-[20px] font-semibold text-white mt-1">
                  ₹{overview.metrics.grossSalesVolumeINR?.toLocaleString()}
                </p>
              </div>

              <div className="p-3.5 rounded-[12px] bg-[#161616] border border-[#212121]">
                <span className="text-[10px] uppercase font-mono text-[#606060]">Passes Sold</span>
                <p className="font-heading text-[20px] font-semibold text-white mt-1">
                  {overview.metrics.totalTicketsSold}
                </p>
              </div>

              <div className="p-3.5 rounded-[12px] bg-[#161616] border border-[#212121]">
                <span className="text-[10px] uppercase font-mono text-[#606060]">Active Holds (TTL)</span>
                <p className="font-heading text-[20px] font-semibold text-white mt-1">
                  {overview.metrics.activeHoldsCount} ({overview.metrics.activeTicketsHeld} passes)
                </p>
              </div>

              <div className="p-3.5 rounded-[12px] bg-[#161616] border border-[#212121]">
                <span className="text-[10px] uppercase font-mono text-[#606060]">Checked-In Ratio</span>
                <p className="font-heading text-[20px] font-semibold text-white mt-1">
                  {overview.metrics.totalCheckedIn} / {overview.metrics.totalTicketsSold}
                </p>
              </div>
            </div>

            {/* Real-time Website Synchronizer Tool */}
            <div className="p-4 rounded-[12px] bg-[#161616] border border-[#212121] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-white" />
                  <h4 className="font-heading font-semibold text-white text-[14px]">
                    Real-Time Upstream Website Sync Simulator
                  </h4>
                </div>
                <p className="text-[11px] text-[#848484] font-body mt-1">
                  Emulates updates or ticket release drops from axess.zone and broadcasts live updates over WebSockets without manual refresh.
                </p>
                {syncMsg && <p className="text-[11px] text-white font-mono mt-1 font-semibold">{syncMsg}</p>}
              </div>

              <button
                onClick={handleTriggerSync}
                disabled={syncing}
                className="h-8 px-4 rounded-[20px] bg-white text-black font-heading text-[12px] font-medium hover:bg-[#e0e0e0] active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-40 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing Clients...' : 'Trigger Live Sync'}</span>
              </button>
            </div>

            {/* User Directory */}
            <div className="flex flex-col gap-2">
              <h4 className="font-heading text-[14px] font-semibold text-white">Registered Multi-Role Entities</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px] font-mono border border-[#212121] rounded-[10px] overflow-hidden">
                  <thead className="bg-[#141414] text-[#606060] border-b border-[#212121]">
                    <tr>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Role</th>
                      <th className="p-2.5">Company</th>
                      <th className="p-2.5">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#212121] bg-[#161616]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-[#1a1a1a]">
                        <td className="p-2.5 text-white font-semibold font-heading">{u.name}</td>
                        <td className="p-2.5 text-[#848484]">{u.email}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-[6px] bg-[#111111] border border-[#212121] text-white text-[10px]">
                            {u.role}
                          </span>
                        </td>
                        <td className="p-2.5 text-[#606060]">{u.company_name || 'Individual'}</td>
                        <td className="p-2.5 text-[#606060]">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}