import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  X,
  User,
  Calendar,
  Share2,
  Award,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onBrowseWithoutLogin }) {
  const { switchRole, login, role, isAuthenticated, demoAccounts } = useAuth();
  const [selectedRole, setSelectedRole] = useState(role || 'USER');
  const [activeTab, setActiveTab] = useState('quick-roles'); // 'quick-roles' | 'custom-credentials'
  const [customEmail, setCustomEmail] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const roleOptions = [
    {
      id: 'USER',
      label: 'User',
      sublabel: 'Attendee',
      description: 'Discover events, purchase passes, hold tiers, and access your digital QR entry passes.',
      icon: User,
      email: 'attendee@axess.zone',
      badge: 'Public Attendee'
    },
    {
      id: 'ORGANIZER',
      label: 'Organizer',
      sublabel: 'Event Organiser',
      description: 'Create events, manage ticketing tiers, toggle tier sales states, and monitor ticket revenues.',
      icon: Calendar,
      email: 'organizer@axess.zone',
      badge: 'Certified Host'
    },
    {
      id: 'PROMOTER',
      label: 'Promoter',
      sublabel: 'Affiliate & Rep',
      description: 'Access trackable referral links, custom voucher codes, click analytics, and commission payouts.',
      icon: Share2,
      email: 'promoter@axess.zone',
      badge: 'Official Rep'
    },
    {
      id: 'SPONSOR',
      label: 'Sponsor',
      sublabel: 'Brand Partner',
      description: 'Explore festival activations, stage naming rights, media kits, and submit sponsorship inquiries.',
      icon: Award,
      email: 'sponsor@axess.zone',
      badge: 'Brand Deck'
    },
    {
      id: 'ADMIN',
      label: 'App Owner',
      sublabel: 'Master Admin',
      description: 'Master frontend & backend control: edit or remove any event, modify all tiers, gate check-in, and sync engine.',
      icon: ShieldAlert,
      email: 'admin@axess.zone',
      badge: 'Full Root Access'
    }
  ];

  const handleSelectAndLogin = async (targetRole) => {
    setSelectedRole(targetRole);
    setLoading(true);
    setErrorMsg('');
    try {
      await switchRole(targetRole);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customEmail) {
      setErrorMsg('Please enter your email');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await login(customEmail, customPassword || 'password123');
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleBrowseAsGuest = () => {
    if (onBrowseWithoutLogin) {
      onBrowseWithoutLogin();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0D0D10] border border-[#212121] rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header Bar with Close */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
          <div className="w-8"></div>
          <div className="flex flex-col items-center">
            <img
              src="/brand/header-logo.png"
              alt="Axess"
              className="h-7 w-auto object-contain"
            />
          </div>
          <button
            onClick={onClose}
            aria-label="Close login modal"
            className="w-8 h-8 rounded-full bg-[#161619] border border-[#262629] hover:border-white/40 text-[#888] hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Description */}
        <div className="text-center px-6 pt-2 pb-4 shrink-0">
          <h2 className="font-heading text-[22px] font-semibold text-white tracking-tight">
            Enter Axess
          </h2>
          <p className="font-body text-[13px] text-[#A1A1AA] mt-1 max-w-sm mx-auto">
            Choose your role to access your dedicated portal, or explore freely without signing in.
          </p>

          {/* Mode Switcher Tabs */}
          <div className="inline-flex p-1 rounded-xl bg-[#141417] border border-[#222226] mt-4">
            <button
              onClick={() => setActiveTab('quick-roles')}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                activeTab === 'quick-roles'
                  ? 'bg-white text-black shadow-sm font-semibold'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              Select Your Role
            </button>
            <button
              onClick={() => setActiveTab('custom-credentials')}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                activeTab === 'custom-credentials'
                  ? 'bg-white text-black shadow-sm font-semibold'
                  : 'text-[#888] hover:text-white'
              }`}
            >
              Sign In with Email
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mx-6 mb-3 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-[12px] text-center">
            {errorMsg}
          </div>
        )}

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-6 pb-6 flex-1 flex flex-col gap-3">
          {activeTab === 'quick-roles' ? (
            <div className="flex flex-col gap-2.5">
              {roleOptions.map((opt) => {
                const IconComponent = opt.icon;
                const isCurrent = isAuthenticated && role === opt.id;
                const isAdmin = opt.id === 'ADMIN';

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectAndLogin(opt.id)}
                    disabled={loading}
                    className={`w-full text-left p-4 rounded-[14px] border transition-all flex items-start gap-3.5 group relative ${
                      isCurrent
                        ? 'bg-[#18181D] border-white/60 ring-1 ring-white/30'
                        : isAdmin
                        ? 'bg-[#121115] border-[#312B3E] hover:border-white/50 hover:bg-[#181622]'
                        : 'bg-[#131316] border-[#222226] hover:border-[#38383F] hover:bg-[#18181C]'
                    }`}
                  >
                    {/* Role Icon Box */}
                    <div
                      className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 transition-colors ${
                        isCurrent
                          ? 'bg-white text-black'
                          : isAdmin
                          ? 'bg-[#221C2F] text-white border border-[#40355A]'
                          : 'bg-[#1D1D22] text-[#CCC] border border-[#2A2A30] group-hover:text-white group-hover:border-white/30'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Middle Info */}
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-semibold text-[15px] text-white tracking-tight">
                          {opt.label}
                        </span>
                        <span className="text-[11px] font-mono text-[#848484]">
                          ({opt.sublabel})
                        </span>
                        {opt.badge && (
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${
                              isAdmin
                                ? 'bg-[#31264E] text-[#D8B4FE] border border-[#4C3B78] font-bold'
                                : 'bg-[#1C1C22] text-[#A1A1AA] border border-[#2B2B33]'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="font-body text-[12px] text-[#848484] group-hover:text-[#A1A1AA] mt-1 leading-normal transition-colors">
                        {opt.description}
                      </p>
                    </div>

                    {/* Right Arrow / Checkmark */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {isCurrent ? (
                        <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-black" />
                        </div>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#555] group-hover:text-white transition-colors" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Custom Email / Password Form */
            <form onSubmit={handleCustomSubmit} className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase font-mono tracking-wider text-[#A1A1AA]">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#666] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="you@axess.zone"
                    className="w-full h-11 pl-10 pr-4 rounded-[10px] bg-[#141418] border border-[#24242A] text-white text-[14px] placeholder:text-[#666] focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase font-mono tracking-wider text-[#A1A1AA]">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#666] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-11 pl-10 pr-10 rounded-[10px] bg-[#141418] border border-[#24242A] text-white text-[14px] placeholder:text-[#666] focus:outline-none focus:border-white transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#666] hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Auto-Fill Credentials */}
              <div className="p-3 rounded-lg bg-[#141418] border border-[#212126] flex flex-col gap-1.5 text-[11px]">
                <span className="text-[#848484] font-mono">Quick-fill Demo Accounts:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setCustomEmail('admin@axess.zone'); setCustomPassword('password123'); }}
                    className="px-2 py-0.5 rounded bg-[#201c2a] border border-[#3b3252] text-[#c084fc] hover:brightness-125"
                  >
                    Master Owner (admin@axess.zone)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCustomEmail('organizer@axess.zone'); setCustomPassword('password123'); }}
                    className="px-2 py-0.5 rounded bg-[#1c1c22] border border-[#2c2c36] text-[#A1A1AA] hover:text-white"
                  >
                    Organizer
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCustomEmail('attendee@axess.zone'); setCustomPassword('password123'); }}
                    className="px-2 py-0.5 rounded bg-[#1c1c22] border border-[#2c2c36] text-[#A1A1AA] hover:text-white"
                  >
                    User
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 h-11 rounded-[10px] bg-white text-black font-heading font-semibold text-[14px] hover:bg-neutral-200 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Prominent "Browse without logging in" Option */}
          <div className="pt-4 mt-2 border-t border-[#1C1C22] flex flex-col items-center text-center">
            <button
              onClick={handleBrowseAsGuest}
              className="group inline-flex items-center gap-2 text-[14px] font-medium text-white hover:text-neutral-300 py-2 px-4 rounded-full bg-[#16161B] border border-[#282830] hover:border-white/40 transition-all active:scale-95"
            >
              <span>Browse without logging in</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#888] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </button>
            <p className="text-[11px] text-[#606060] font-mono mt-2">
              Explore public gigs, listen to vibe reels, and preview tickets freely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
