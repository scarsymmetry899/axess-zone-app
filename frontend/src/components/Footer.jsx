import React, { useState } from 'react';

function InstagramIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

export default function Footer({ onOpenPolicy, onOpenPortal }) {
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="bg-[#0b0c0e] border-t border-white/10 mt-16">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-10 lg:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_2fr] gap-8 lg:gap-12">
          {/* Logo & Tagline */}
          <div>
            <a className="relative inline-block w-[150px]" href="#up-next">
              <img
                alt="Axess"
                width={1014}
                height={206}
                className="h-auto w-[150px] object-contain"
                src="/brand/header-logo.png"
              />
            </a>
            <p className="mt-3 text-sm text-[#848484] font-body leading-relaxed">
              X Marks The Spot
            </p>
          </div>

          {/* Explore & Sign In */}
          <div>
            <h4 className="text-sm font-heading font-semibold text-white mb-4">Explore</h4>
            <nav className="flex flex-col gap-2.5">
              <a className="text-sm text-[#848484] font-body hover:text-white transition-colors" href="#up-next">
                Up next
              </a>
              <a className="text-sm text-[#848484] font-body hover:text-white transition-colors" href="#past-gigs">
                Past Gigs
              </a>
              <button
                onClick={() => onOpenPortal?.('ORGANIZER')}
                className="text-left text-sm text-[#848484] font-body hover:text-white transition-colors"
              >
                Join as an Organizer
              </button>
              <button
                onClick={() => onOpenPortal?.('PROMOTER')}
                className="text-left text-sm text-[#848484] font-body hover:text-white transition-colors"
              >
                Become a Promoter
              </button>
              <button
                onClick={() => onOpenPortal?.('SPONSOR')}
                className="text-left text-sm text-[#848484] font-body hover:text-white transition-colors"
              >
                Become a Sponsor
              </button>
            </nav>

            <h4 className="text-sm font-heading font-semibold text-white mt-6 mb-3">Sign In</h4>
            <nav className="flex flex-col gap-2.5">
              <button
                onClick={() => onOpenPortal?.('ORGANIZER')}
                className="text-left text-sm text-[#848484] font-body hover:text-white transition-colors"
              >
                Organizer Login
              </button>
              <button
                onClick={() => onOpenPortal?.('PROMOTER')}
                className="text-left text-sm text-[#848484] font-body hover:text-white transition-colors"
              >
                Promoter Login
              </button>
              <button
                onClick={() => onOpenPortal?.('SPONSOR')}
                className="text-left text-sm text-[#848484] font-body hover:text-white transition-colors"
              >
                Sponsor Login
              </button>
            </nav>
          </div>

          {/* About & Follow */}
          <div>
            <h4 className="text-sm font-heading font-semibold text-white mb-4">About</h4>
            <nav className="flex flex-col gap-2.5">
              <a
                className="text-sm text-[#848484] font-body hover:text-white transition-colors"
                href="mailto:socials@axess.zone"
              >
                Contact Us
              </a>
              <button
                onClick={() => onOpenPolicy?.('about')}
                className="text-left text-sm text-[#848484] font-body hover:text-white transition-colors"
              >
                About Us
              </button>
            </nav>

            <h4 className="text-sm font-heading font-semibold text-white mt-6 mb-3">Follow</h4>
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/axess.zone/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#848484] hover:text-white transition-colors p-1"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=100086087511965"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#848484] hover:text-white transition-colors p-1"
                aria-label="Facebook"
              >
                <FacebookIcon />
              </a>
            </div>
          </div>

          {/* Subscribe */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h4 className="text-base font-heading font-semibold text-white mb-4">Subscribe</h4>
            <form onSubmit={handleSubscribe} className="flex items-center gap-3 border-b border-[#444] pb-3">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your email id"
                aria-label="Email address"
                className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder-[#666] outline-none font-body"
              />
              <button
                type="submit"
                className="text-sm font-semibold text-black bg-white px-5 py-2 rounded-md hover:opacity-90 transition-colors shrink-0 font-heading"
              >
                Send
              </button>
            </form>
            {subscribed && (
              <p className="text-[12px] text-white font-mono mt-2">
                ✓ Subscribed to Axess live announcements.
              </p>
            )}
          </div>
        </div>

        {/* Bottom Legal & Rights Row */}
        <div className="mt-10 pt-6 border-t border-[#212121]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <p className="text-xs text-[#606060] font-body">All Rights Reserved. © 2022 – 2026</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#606060] font-body">
              <button onClick={() => onOpenPolicy?.('terms')} className="hover:text-white transition-colors">
                Terms of use
              </button>
              <span>|</span>
              <button onClick={() => onOpenPolicy?.('privacy')} className="hover:text-white transition-colors">
                Privacy policy
              </button>
              <span>|</span>
              <button onClick={() => onOpenPolicy?.('refunds')} className="hover:text-white transition-colors">
                Refund and Returns Policy
              </button>
              <span>|</span>
              <button onClick={() => onOpenPortal?.('ORGANIZER')} className="hover:text-white transition-colors">
                Partner Login
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#606060] font-body lg:text-right">
            Axess and its assets belong to MYCELIAL TECHNOLOGY PRIVATE LIMITED.
          </p>
        </div>
      </div>
    </footer>
  );
}