import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { Search, ShoppingBag, ChevronDown, Menu, X, ShieldCheck, QrCode, LayoutDashboard, LogOut, Radio, User } from 'lucide-react';

export default function Navbar({
  onOpenLogin,
  onOpenTickets,
  onOpenOrganizer,
  onOpenPromoter,
  onOpenSponsor,
  onOpenAdmin,
  onOpenGateScanner,
  onNavigateSection,
  searchQuery,
  onSearchChange,
}) {
  const { user, isAuthenticated, role, switchRole, logout, demoAccounts } = useAuth();
  const { connected } = useSocket();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-[#212121]/50">
      <div className="mx-auto flex h-[94px] max-w-[1440px] items-center justify-between gap-6 px-6 lg:px-[30px]">
        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden text-white shrink-0 transition-transform active:scale-90"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* AXESS Official Header Logo */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="relative hidden lg:block shrink-0 w-[150px] transition-opacity hover:opacity-90"
        >
          <img
            src="/brand/header-logo.png"
            alt="Axess"
            width="1014"
            height="206"
            className="h-auto w-[130px] object-contain"
          />
        </a>

        {/* Mobile Header Logo */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="lg:hidden shrink-0"
        >
          <img
            src="/brand/header-logo.png"
            alt="Axess"
            width="1014"
            height="206"
            className="h-[22px] w-auto object-contain"
          />
        </a>

        {/* Center Desktop Navigation Pills (Exact Axess Glassmorphic styling) */}
        <nav className="hidden lg:flex items-center justify-center gap-8 rounded-[20px] flex-nowrap">
          <button
            onClick={() => onNavigateSection?.('up-next')}
            className="flex h-[39px] items-center justify-center whitespace-nowrap text-base font-normal text-white transition-all shrink-0 rounded-[20px] bg-[#00000033] px-5 shadow-glass-pill backdrop-blur-[2px] hover:brightness-110 active:scale-95"
          >
            Up Next
          </button>
          <button
            onClick={() => onNavigateSection?.('past-gigs')}
            className="flex h-[39px] items-center justify-center whitespace-nowrap text-base font-normal text-white transition-all shrink-0 hover:opacity-80 active:scale-95"
          >
            Past Gigs
          </button>
          <button
            onClick={() => onNavigateSection?.('vibe-check')}
            className="flex h-[39px] items-center justify-center whitespace-nowrap text-base font-normal text-white transition-all shrink-0 hover:opacity-80 active:scale-95"
          >
            Vibe Check
          </button>
          <button
            onClick={onOpenOrganizer}
            className="flex h-[39px] items-center justify-center whitespace-nowrap text-base font-normal text-white transition-all shrink-0 hover:opacity-80 active:scale-95"
          >
            List Your Event
          </button>
        </nav>

        {/* Integrated Header Search Form (Glassmorphic) */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="hidden lg:flex flex-1 max-w-[280px] items-center gap-2 h-[39px] rounded-[30px] bg-[#00000033] px-4 shadow-glass-search backdrop-blur-[2px] border border-white/10 focus-within:border-white/30 transition-all"
        >
          <Search className="h-[15px] w-[15px] shrink-0 text-[#aaa]" />
          <input
            type="search"
            value={searchQuery || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search events..."
            aria-label="Search events"
            className="w-full bg-transparent text-sm font-normal text-white outline-none placeholder:text-[#888]"
          />
        </form>

        {/* Right Action Controls: Realtime Status, Portals, Your Tickets, Login */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Live Sync Status indicator */}
          <div
            title={connected ? 'Connected to Axess Real-Time Gateway' : 'Connecting to real-time gateway...'}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111111] border border-[#212121] text-[11px] text-[#848484]"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-white animate-pulse' : 'bg-[#606060]'}`}></span>
            <span className="font-mono text-[10px] uppercase tracking-wider">{connected ? 'Live Sync' : 'Reconnecting'}</span>
          </div>

          {/* Role specific quick action pill */}
          {isAuthenticated && (
            <>
              {role === 'ORGANIZER' && (
                <button
                  onClick={onOpenOrganizer}
                  className="hidden sm:flex h-[39px] px-3.5 rounded-[12px] bg-[#111] border border-[#262626] hover:border-white/40 text-white items-center gap-1.5 text-[12px] font-medium transition-all"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#aaa]" />
                  <span>Organiser Portal</span>
                </button>
              )}
              {(role === 'ORGANIZER' || role === 'ADMIN') && (
                <button
                  onClick={onOpenGateScanner}
                  title="Gate Pass Scanner & Validator"
                  className="hidden sm:flex h-[39px] px-3.5 rounded-[12px] bg-[#111] border border-[#262626] hover:border-white/40 text-white items-center gap-1.5 text-[12px] font-medium transition-all"
                >
                  <QrCode className="w-3.5 h-3.5 text-white" />
                  <span>Gate Scanner</span>
                </button>
              )}
              {role === 'PROMOTER' && (
                <button
                  onClick={onOpenPromoter}
                  className="hidden sm:flex h-[39px] px-3.5 rounded-[12px] bg-[#111] border border-[#262626] hover:border-white/40 text-white items-center gap-1.5 text-[12px] font-medium transition-all"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#aaa]" />
                  <span>Promoter Hub</span>
                </button>
              )}
              {role === 'SPONSOR' && (
                <button
                  onClick={onOpenSponsor}
                  className="hidden sm:flex h-[39px] px-3.5 rounded-[12px] bg-[#111] border border-[#262626] hover:border-white/40 text-white items-center gap-1.5 text-[12px] font-medium transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#aaa]" />
                  <span>Sponsors</span>
                </button>
              )}
              {role === 'ADMIN' && (
                <button
                  onClick={onOpenAdmin}
                  className="hidden sm:flex h-[39px] px-3.5 rounded-[12px] bg-[#111] border border-[#262626] hover:border-white/40 text-white items-center gap-1.5 text-[12px] font-medium transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span>Admin</span>
                </button>
              )}
            </>
          )}

          {/* Your Tickets Bag Icon Button (Matches axess.zone shopping bag icon) */}
          <button
            type="button"
            onClick={onOpenTickets}
            aria-label="Your tickets"
            className="relative shrink-0 rounded-full p-2.5 text-white transition-colors hover:bg-white/10 active:scale-95"
          >
            <ShoppingBag className="w-[19px] h-[19px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-white"></span>
          </button>

          {/* Official Axess Login Button with brand/login-icon.png */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  onOpenLogin?.();
                } else {
                  setDropdownOpen(!dropdownOpen);
                }
              }}
              aria-label="Login"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white bg-white text-black hover:opacity-90 transition-all active:scale-95 lg:h-10 lg:w-auto lg:gap-1.5 lg:rounded-[10px] lg:px-4"
            >
              <img
                src="/brand/login-icon.png"
                alt=""
                width="18"
                height="18"
                className="h-[18px] w-[18px] object-contain"
              />
              <span className="hidden items-center gap-1 text-base font-normal lg:flex text-black">
                {isAuthenticated ? (role === 'ADMIN' ? 'App Owner' : role) : 'Login'}
                {isAuthenticated && (
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                )}
              </span>
            </button>

            {/* Dropdown Menu (Strictly Monochromatic Dark Neutral) */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-72 bg-[#111111] border border-[#212121] rounded-[14px] shadow-modal overflow-hidden p-2 z-50 text-[13px] animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-2.5 border-b border-[#212121] mb-1">
                  <p className="text-[10px] uppercase font-mono tracking-widest text-[#606060] font-semibold">Active Session</p>
                  <p className="text-white font-medium truncate mt-0.5">{user?.name || 'Public Guest'}</p>
                  <p className="text-[11px] text-[#848484] truncate">{user?.email || 'Unauthenticated Visitor'}</p>
                  <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded bg-black border border-[#212121] text-[10px] font-mono text-[#848484]">
                    Role: {role === 'ADMIN' ? 'App Owner' : role}
                  </div>
                </div>

                <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-widest text-[#606060] font-semibold">
                  Multi-Role Portals & Logins
                </div>

                <div className="flex flex-col gap-0.5">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.role}
                      onClick={() => {
                        switchRole(acc.role);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                        role === acc.role
                          ? 'bg-[#212121] text-white font-semibold'
                          : 'text-[#848484] hover:bg-[#161616] hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[12px]">{acc.label}</span>
                        <span className="text-[10px] text-[#606060]">{acc.email}</span>
                      </div>
                      {role === acc.role && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                    </button>
                  ))}
                </div>

                <div className="pt-2 mt-2 border-t border-[#212121] flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenLogin?.();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-white hover:bg-[#161616] flex items-center gap-2 text-[12px] transition-colors font-medium"
                  >
                    <User className="w-3.5 h-3.5 text-[#AAA]" />
                    <span>Open Role Selection Modal</span>
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-[#1c1212] flex items-center gap-2 text-[12px] transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Slide-down Menu (Matching Axess exact mobile menu) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#212121] bg-black px-6 py-4 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex items-center gap-2 h-[39px] rounded-[30px] bg-[#111] px-4 border border-[#303030]"
          >
            <Search className="h-[15px] w-[15px] shrink-0 text-[#888]" />
            <input
              type="search"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search events..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#666]"
            />
          </form>

          <nav className="flex flex-col gap-3 text-sm font-medium">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateSection?.('up-next');
              }}
              className="text-left text-white py-1"
            >
              Up Next
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateSection?.('past-gigs');
              }}
              className="text-left text-white/80 py-1"
            >
              Past Gigs
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateSection?.('vibe-check');
              }}
              className="text-left text-white/80 py-1"
            >
              Vibe Check
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenOrganizer();
              }}
              className="text-left text-white/80 py-1"
            >
              List Your Event
            </button>
          </nav>

          <div className="space-y-3 border-t border-[#212121] pt-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenLogin?.();
              }}
              className="w-full py-2 rounded-xl bg-white text-black font-semibold text-center text-sm"
            >
              Select Role / Login Screen
            </button>
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-widest text-[#606060]">App Owner / Master</p>
              <div className="flex gap-4">
                <button onClick={() => { switchRole('ADMIN'); setMobileMenuOpen(false); onOpenAdmin(); }} className="text-sm text-[#D8B4FE] hover:text-white font-semibold">
                  App Owner Master Control
                </button>
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-widest text-[#606060]">Users</p>
              <div className="flex gap-4">
                <button onClick={() => { switchRole('USER'); setMobileMenuOpen(false); }} className="text-sm text-[#ccc] hover:text-white">
                  Login as Attendee
                </button>
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-widest text-[#606060]">Event Organisers</p>
              <div className="flex gap-4">
                <button onClick={() => { switchRole('ORGANIZER'); setMobileMenuOpen(false); onOpenOrganizer(); }} className="text-sm text-[#ccc] hover:text-white">
                  Organiser Portal
                </button>
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-widest text-[#606060]">Promoters</p>
              <div className="flex gap-4">
                <button onClick={() => { switchRole('PROMOTER'); setMobileMenuOpen(false); onOpenPromoter(); }} className="text-sm text-[#ccc] hover:text-white">
                  Promoter Hub
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
