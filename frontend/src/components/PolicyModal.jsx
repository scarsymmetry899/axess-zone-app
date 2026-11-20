import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

export default function PolicyModal({ type, onClose }) {
  if (!type) return null;

  const content = {
    terms: {
      title: 'Terms of Service',
      body: `1. Admission & Entry Rights:
Axess and participating event organizers reserve the right to verify credentials and refuse admission to any ticket holder without refund in cases of disorderly conduct, counterfeit passes, or breach of venue safety protocols.

2. Non-Transferable Digital QR Passes:
Every Axess access pass is cryptographically signed with HMAC-SHA256 signatures tying the barcode to the registered attendee. Passes cannot be duplicated or photocopied.

3. Venue & Age Restrictions:
Unless explicitly stated otherwise, live electronic and underground events are strictly restricted to attendees aged 21 years and above with government-issued photo ID.`
    },
    privacy: {
      title: 'Privacy Policy',
      body: `1. Data Collection:
Axess collects attendee names, contact details (phone, email), and transaction metadata strictly to facilitate pass generation, door check-in authentication, and urgent event schedule updates.

2. Security & Encryption:
All payment orders, idempotency tokens, and gate scan payloads are transmitted over TLS 1.3 and verified against HMAC-SHA256 platform secrets.

3. No Third-Party Reselling:
We do not sell personal data to external advertisers. Promoter attribution is tracked purely by promo code association.`
    },
    refunds: {
      title: 'Refund & Returns Policy',
      body: `1. General Refund Rules:
Tickets are non-refundable once purchased, except in instances where an event is formally cancelled or rescheduled by the organizer.

2. Rescheduled Events:
In the event of weather-related or logistical postponement, tickets remain valid for the rescheduled date. Attendees unable to attend may request a platform credit refund within 7 calendar days of the announcement.

3. Authorized Platform Refunds:
Authorized refunds approved by Event Organizers or Axess Ops immediately release ticket capacity back to the available inventory pool and void the QR pass security signature.`
    },
    about: {
      title: 'About Axess',
      body: `Axess is the live event discovery, cryptographic ticketing, and partner management platform curated for underground gatherings, festival rituals, and club showcases across Goa, Bangalore, Kasol, and beyond.

Our mission is to bring transparency, authentic ticket access, and direct relationships between creators, organizers, promoters, and attendees without predatory fees or counterfeit passes.`
    }
  }[type] || { title: 'Legal Documentation', body: 'Axess platform terms and policies.' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#111111] border border-[#212121] rounded-[20px] p-6 shadow-2xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#212121] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-white" />
            <h3 className="font-heading text-[16px] font-semibold text-white">{content.title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1c1c1c] border border-[#2e2e2e] hover:border-white/40 text-[#848484] hover:text-white flex items-center justify-center transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[13px] text-[#848484] font-body whitespace-pre-line leading-relaxed max-h-[60vh] overflow-y-auto">
          {content.body}
        </div>
        <button
          onClick={onClose}
          className="w-full h-10 rounded-[24px] bg-white text-black font-heading text-[13px] font-semibold hover:bg-[#e0e0e0] active:scale-95 transition-all shadow-sm"
        >
          Acknowledge & Close
        </button>
      </div>
    </div>
  );
}