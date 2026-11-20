import React, { useState } from 'react';
import { api } from '../api/client.js';
import { X, QrCode, ShieldCheck, CheckCircle2, AlertOctagon, Search } from 'lucide-react';

export default function GateScannerModal({ onClose }) {
  const [ticketInput, setTicketInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [recentScans, setRecentScans] = useState([]);

  const handleVerifyPass = async (codeToVerify) => {
    const code = codeToVerify || ticketInput;
    if (!code || !code.trim()) return;

    setScanning(true);
    setErrorMsg('');
    setScanResult(null);

    try {
      const res = await api.verifyGateScan({
        ticketCode: code.trim()
      });

      setScanResult(res);
      setRecentScans((prev) => [
        {
          code: code.trim(),
          status: res.status,
          attendee: res.ticket?.attendee_name || 'Attendee',
          tier: res.ticket?.tier_name,
          time: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 5)
      ]);
      setTicketInput('');
    } catch (err) {
      setErrorMsg(err.message || 'Pass validation failed');
      setRecentScans((prev) => [
        {
          code: code.trim(),
          status: 'DENIED',
          attendee: 'Blocked Pass',
          tier: 'Unknown',
          time: new Date().toLocaleTimeString(),
          error: err.message
        },
        ...prev.slice(0, 5)
      ]);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#111111] border border-[#212121] rounded-[20px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="h-14 px-5 border-b border-[#212121] flex items-center justify-between shrink-0 bg-[#111111]">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-white" />
            <span className="font-heading text-[14px] font-semibold text-white tracking-wide">
              Gate Pass Verification Scanner
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-[#1c1c1c] border border-[#2e2e2e] hover:border-white/40 text-[#848484] hover:text-white flex items-center justify-center transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[80vh] flex flex-col gap-5">
          {/* Top Info Banner */}
          <div className="p-3.5 rounded-[12px] bg-[#161616] border border-[#212121] flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-white shrink-0" />
            <p className="text-[12px] text-[#848484] font-body leading-relaxed">
              Scan pass barcode or enter code. Verifies cryptographic HMAC signatures and blocks duplicate admissions.
            </p>
          </div>

          {/* Quick Demo Test Codes */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase font-mono text-[#606060]">Quick Test Code (Pre-seeded):</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setTicketInput('AXS-UNM-882190');
                  handleVerifyPass('AXS-UNM-882190');
                }}
                className="h-7 px-3 rounded-[10px] bg-[#161616] border border-[#212121] hover:border-white/40 text-[11px] font-mono text-white transition-colors"
              >
                AXS-UNM-882190 (Arjun Patel)
              </button>
            </div>
          </div>

          {/* Manual Input Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#606060] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyPass()}
                placeholder="Enter ticket code or scan QR..."
                className="w-full h-10 pl-9 pr-3 rounded-[10px] bg-[#0d0d0d] border border-[#262626] focus:border-white text-white font-mono text-[13px] uppercase outline-none"
              />
            </div>
            <button
              onClick={() => handleVerifyPass()}
              disabled={scanning || !ticketInput.trim()}
              className="h-10 px-5 rounded-[20px] bg-white text-black font-heading text-[13px] font-semibold hover:bg-[#e0e0e0] active:scale-95 transition-all disabled:opacity-40 shadow-sm"
            >
              {scanning ? 'Checking...' : 'Validate'}
            </button>
          </div>

          {/* Scan Result Feedback Banner */}
          {scanResult && (
            <div className="p-4 rounded-[12px] bg-white text-black border border-white flex flex-col gap-2 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-black" />
                <h4 className="font-heading font-semibold text-[16px] text-black">ENTRY GRANTED • ADMITTED</h4>
              </div>
              <div className="border-t border-black/20 pt-2 flex flex-col gap-1 text-[12px] font-mono">
                <p><strong>Attendee:</strong> {scanResult.ticket?.attendee_name}</p>
                <p><strong>Pass Tier:</strong> {scanResult.ticket?.tier_name}</p>
                <p><strong>Event:</strong> {scanResult.ticket?.event_title}</p>
                <p><strong>Code:</strong> {scanResult.ticket?.ticket_code}</p>
                <p><strong>Admitted At:</strong> {new Date(scanResult.admittedAt).toLocaleTimeString()}</p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-[12px] bg-red-950/40 border border-red-800 text-red-300 flex items-start gap-3 animate-in zoom-in-95 duration-200">
              <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-heading font-semibold text-[14px] text-red-200">ENTRY DENIED</h4>
                <p className="text-[12px] font-mono mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Recent Door Check-ins Audit */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[#212121]">
            <span className="text-[10px] uppercase font-mono text-[#606060]">Recent Gate Verifications:</span>
            {recentScans.length === 0 ? (
              <p className="text-[12px] text-[#606060] font-mono">No scans recorded in this session.</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {recentScans.map((scan, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-[8px] bg-[#161616] border border-[#212121] flex items-center justify-between text-[11px] font-mono"
                  >
                    <div>
                      <span className="font-bold text-white">{scan.code}</span>
                      <span className="text-[#848484] ml-2">{scan.attendee}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#606060]">{scan.time}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold ${
                          scan.status === 'ADMITTED'
                            ? 'bg-white text-black'
                            : 'bg-red-950 border border-red-800 text-red-400'
                        }`}
                      >
                        {scan.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}