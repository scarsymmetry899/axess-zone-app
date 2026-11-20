import React, { useState, useEffect } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { X, Check, Building2 } from 'lucide-react';

export default function SponsorPortal({ onClose }) {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inquiry submission state
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [companyName, setCompanyName] = useState(user?.company_name || 'Void Acoustics India');
  const [contactPerson, setContactPerson] = useState(user?.name || 'Rohit Nambiar');
  const [email, setEmail] = useState(user?.email || 'sponsor@axess.zone');
  const [phone, setPhone] = useState(user?.phone || '+91 98111 22334');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    Promise.all([api.getSponsorshipPackages(), api.getMyInquiries()])
      .then(([pkgRes, inqRes]) => {
        setPackages(pkgRes.packages || []);
        setInquiries(inqRes.inquiries || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmitInquiry = async (e) => {
    e.preventDefault();
    if (!companyName || !contactPerson || !email || !selectedPackage) return;

    setSubmitting(true);
    try {
      await api.submitSponsorshipInquiry({
        companyName,
        contactPerson,
        email,
        phone,
        eventId: 'ev_unmada_nye',
        packageTier: selectedPackage.tier,
        budgetRange: selectedPackage.priceINR,
        message
      });
      setSubmitted(true);
      const inqRes = await api.getMyInquiries();
      setInquiries(inqRes.inquiries || []);
    } catch (err) {
      alert(`Inquiry failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#111111] border border-[#212121] rounded-[20px] shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="h-14 px-5 border-b border-[#212121] flex items-center justify-between shrink-0 bg-[#111111]">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-white" />
            <span className="font-heading text-[14px] font-semibold text-white tracking-wide">
              Brand Sponsorships & Activations
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
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2 text-[#848484]">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[12px] font-mono">Loading brand sponsorship deck...</p>
          </div>
        ) : (
          <div className="p-5 sm:p-6 overflow-y-auto max-h-[80vh] flex flex-col gap-6">
            <div>
              <h3 className="font-heading text-[20px] font-semibold text-white">Event Partnership Deck</h3>
              <p className="text-[12px] text-[#848484] font-body mt-0.5">
                Integrate your brand natively into marquee underground gatherings, stage environments, and VIP lounges.
              </p>
            </div>

            {/* Packages Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {packages.map((pkg, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-[12px] bg-[#161616] border border-[#212121] flex flex-col justify-between gap-4"
                >
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[#606060] font-semibold">Tier {idx + 1}</span>
                    <h4 className="font-heading text-[16px] font-semibold text-white mt-0.5">{pkg.tier}</h4>
                    <span className="font-mono text-[14px] font-bold text-white mt-1 inline-block">
                      {pkg.priceINR}
                    </span>

                    <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-[#212121]">
                      {pkg.deliverables.map((del, dIdx) => (
                        <div key={dIdx} className="flex items-start gap-2 text-[12px] text-[#848484] font-body">
                          <Check className="w-3.5 h-3.5 text-white mt-0.5 shrink-0" />
                          <span>{del}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setSubmitted(false);
                    }}
                    className="w-full h-8 px-4 rounded-[20px] bg-white text-black font-heading text-[12px] font-medium hover:bg-[#e0e0e0] active:scale-95 transition-all shadow-sm"
                  >
                    Inquire About This Package
                  </button>
                </div>
              ))}
            </div>

            {/* Inquiry Form */}
            {selectedPackage && (
              <div className="p-5 rounded-[12px] bg-[#1a1a1a] border border-[#333] flex flex-col gap-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-heading text-[15px] font-semibold text-white">
                      Inquire for: {selectedPackage.tier}
                    </h4>
                    <p className="text-[11px] text-[#848484] font-mono">Budget benchmark: {selectedPackage.priceINR}</p>
                  </div>
                  <button onClick={() => setSelectedPackage(null)} className="text-[#848484] hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {submitted ? (
                  <div className="p-4 bg-[#111111] border border-white/20 rounded-[10px] text-center text-white">
                    <p className="font-heading font-semibold">Inquiry Sent!</p>
                    <p className="text-[12px] text-[#848484] font-body mt-1">
                      The Axess Brand Partnerships council will contact {contactPerson} within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitInquiry} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-[#848484] uppercase">Brand / Company</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="h-9 px-3 rounded-[10px] bg-[#0d0d0d] border border-[#262626] text-white text-[12px] font-body"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-[#848484] uppercase">Contact Person</label>
                      <input
                        type="text"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="h-9 px-3 rounded-[10px] bg-[#0d0d0d] border border-[#262626] text-white text-[12px] font-body"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-[#848484] uppercase">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-9 px-3 rounded-[10px] bg-[#0d0d0d] border border-[#262626] text-white text-[12px] font-body"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-[#848484] uppercase">Phone</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-9 px-3 rounded-[10px] bg-[#0d0d0d] border border-[#262626] text-white text-[12px] font-mono"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-[10px] font-mono text-[#848484] uppercase">Activation Goals</label>
                      <textarea
                        rows={2}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="e.g. VIP lounge product sampling, custom stage sound calibration..."
                        className="p-2.5 rounded-[10px] bg-[#0d0d0d] border border-[#262626] text-white text-[12px] font-body"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="sm:col-span-2 h-9 rounded-[24px] bg-white text-black font-heading font-semibold text-[13px] hover:bg-[#e0e0e0] active:scale-95 transition-all shadow-sm"
                    >
                      {submitting ? 'Submitting...' : 'Submit Partnership Proposal'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Existing Inquiries */}
            {inquiries.length > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t border-[#212121]">
                <h4 className="font-heading text-[14px] font-semibold text-white">Your Submitted Inquiries</h4>
                <div className="flex flex-col gap-1.5">
                  {inquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className="p-3 rounded-[10px] bg-[#161616] border border-[#212121] flex items-center justify-between text-[12px]"
                    >
                      <div>
                        <span className="font-heading font-semibold text-white">{inq.package_tier}</span>
                        <p className="text-[11px] text-[#848484] font-body">{inq.event_title}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-[8px] font-mono text-[10px] font-semibold bg-white text-black">
                        {inq.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}