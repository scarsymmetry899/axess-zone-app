import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider, useSocket } from './context/SocketContext.jsx';
import { api } from './api/client.js';

import Navbar from './components/Navbar.jsx';
import HeroCarousel from './components/HeroCarousel.jsx';
import Filters from './components/Filters.jsx';
import UpNextFeed from './components/UpNextFeed.jsx';
import PastGigs from './components/PastGigs.jsx';
import VibeCheck from './components/VibeCheck.jsx';
import EventDetailModal from './components/EventDetailModal.jsx';
import CheckoutModal from './components/CheckoutModal.jsx';
import TicketsWalletModal from './components/TicketsWalletModal.jsx';
import OrganizerPortal from './components/OrganizerPortal.jsx';
import GateScannerModal from './components/GateScannerModal.jsx';
import PromoterPortal from './components/PromoterPortal.jsx';
import SponsorPortal from './components/SponsorPortal.jsx';
import AdminPortal from './components/AdminPortal.jsx';
import PolicyModal from './components/PolicyModal.jsx';
import Footer from './components/Footer.jsx';
import BottomNav from './components/BottomNav.jsx';
import LoginModal from './components/LoginModal.jsx';
import NotificationDrawer from './components/NotificationDrawer.jsx';
import { Sparkles, X } from 'lucide-react';

function MainApp() {
  const { role, switchRole } = useAuth();
  const { socket } = useSocket();

  // Data states
  const [heroEvents, setHeroEvents] = useState([]);
  const [events, setEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [ticketsWalletOpen, setTicketsWalletOpen] = useState(false);
  const [organizerPortalOpen, setOrganizerPortalOpen] = useState(false);
  const [gateScannerOpen, setGateScannerOpen] = useState(false);
  const [promoterPortalOpen, setPromoterPortalOpen] = useState(false);
  const [sponsorPortalOpen, setSponsorPortalOpen] = useState(false);
  const [adminPortalOpen, setAdminPortalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [abandonedCartPrompt, setAbandonedCartPrompt] = useState(null);
  const [activePolicy, setActivePolicy] = useState(null);
  const [bottomNavTab, setBottomNavTab] = useState('explore');

  // Load events
  const loadEventsData = () => {
    setLoading(true);
    Promise.all([
      api.getHeroEvents(),
      api.getEvents({
        location: selectedLocation,
        category: selectedCategory,
        search: searchQuery
      }),
      api.getPastEvents()
    ])
      .then(([heroRes, feedRes, pastRes]) => {
        setHeroEvents(heroRes.events || []);
        setEvents(feedRes.events || []);
        setPastEvents(pastRes.events || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEventsData();
  }, [selectedLocation, selectedCategory, searchQuery]);

  // Real-time synchronization with website updates via WebSockets
  useEffect(() => {
    if (!socket) return;

    const handleFeedUpdate = (data) => {
      console.log('[App] Received real-time events:feed update:', data);
      // Reload discovery feed automatically without manual refresh!
      api.getEvents({
        location: selectedLocation,
        category: selectedCategory,
        search: searchQuery
      }).then((res) => {
        setEvents(res.events || []);
      }).catch(console.error);
    };

    socket.on('events:feed:update', handleFeedUpdate);
    socket.on('tier:change', handleFeedUpdate);

    return () => {
      socket.off('events:feed:update', handleFeedUpdate);
      socket.off('tier:change', handleFeedUpdate);
    };
  }, [socket, selectedLocation, selectedCategory, searchQuery]);

  const handleNavigateSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#FFFFFF] font-sans flex flex-col selection:bg-white selection:text-black">
      {/* Top Navbar */}
      <Navbar
        onOpenLogin={() => setLoginModalOpen(true)}
        onOpenTickets={() => setTicketsWalletOpen(true)}
        onOpenOrganizer={() => setOrganizerPortalOpen(true)}
        onOpenPromoter={() => setPromoterPortalOpen(true)}
        onOpenSponsor={() => setSponsorPortalOpen(true)}
        onOpenAdmin={() => setAdminPortalOpen(true)}
        onOpenGateScanner={() => setGateScannerOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onNavigateSection={handleNavigateSection}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Discover Flow */}
      <main className="flex-1 pt-16">
        {/* 1. Hero Showcase Carousel featuring Marquee Events */}
        <HeroCarousel
          events={heroEvents}
          onSelectEvent={(id) => setSelectedEventId(id)}
        />

        {/* 2. Location & Category Filters */}
        <Filters
          selectedLocation={selectedLocation}
          onSelectLocation={setSelectedLocation}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* 3. Up Next Live Vertical Poster Cards */}
        <UpNextFeed
          events={events}
          onSelectEvent={(id) => setSelectedEventId(id)}
          onBookTickets={(id) => setSelectedEventId(id)}
        />

        {/* 4. Past Gigs Concluded Archive */}
        <PastGigs
          pastEvents={pastEvents}
          onSelectEvent={(id) => setSelectedEventId(id)}
        />

        {/* 5. Vibe Check Community Reel */}
        <VibeCheck />
      </main>

      {/* Footer */}
      <Footer
        onOpenPolicy={(type) => setActivePolicy(type)}
        onOpenPortal={(portalRole) => {
          if (portalRole === 'ORGANIZER') setOrganizerPortalOpen(true);
          else if (portalRole === 'PROMOTER') setPromoterPortalOpen(true);
          else if (portalRole === 'SPONSOR') setSponsorPortalOpen(true);
          else if (portalRole === 'ADMIN') setAdminPortalOpen(true);
          else setTicketsWalletOpen(true);
        }}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={bottomNavTab}
        onTabChange={setBottomNavTab}
        onOpenTickets={() => setTicketsWalletOpen(true)}
        onOpenAccount={() => {
          if (role === 'ORGANIZER') setOrganizerPortalOpen(true);
          else if (role === 'PROMOTER') setPromoterPortalOpen(true);
          else if (role === 'SPONSOR') setSponsorPortalOpen(true);
          else if (role === 'ADMIN') setAdminPortalOpen(true);
          else setTicketsWalletOpen(true);
        }}
      />

      {/* Modals & Overlays */}
      {selectedEventId && (
        <EventDetailModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
          onOpenAdmin={() => setAdminPortalOpen(true)}
          onProceedToCheckout={(data) => {
            setSelectedEventId(null);
            setCheckoutData(data);
          }}
        />
      )}

      {checkoutData && (
        <CheckoutModal
          checkoutData={checkoutData}
          onClose={() => {
            if (checkoutData) {
              setAbandonedCartPrompt(checkoutData);
              api.trackAbandonedCart({
                event_id: checkoutData.event?.id,
                tier_id: checkoutData.tier?.id,
                event_title: checkoutData.event?.title,
                tier_name: checkoutData.tier?.name,
                quantity: checkoutData.quantity || 1,
                total_amount: (checkoutData.tier?.price || 1499) * (checkoutData.quantity || 1)
              }).catch(console.error);
            }
            setCheckoutData(null);
          }}
          onOrderCompleted={() => {
            setAbandonedCartPrompt(null);
            setTicketsWalletOpen(true);
          }}
        />
      )}

      {/* Floating Abandoned Cart Retargeting Nudge Banner */}
      {abandonedCartPrompt && !checkoutData && (
        <div className="fixed bottom-6 right-6 z-40 max-w-md p-4 rounded-2xl bg-[#141418] border border-[#EC4899]/40 shadow-2xl backdrop-blur-md flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EC4899]/20 border border-[#EC4899]/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-[#EC4899]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Your tickets are temporarily held!</p>
              <p className="text-[11px] text-[#A1A1AA]">Use code <strong className="text-white font-mono">CART10</strong> for 10% off before passes release.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setCheckoutData(abandonedCartPrompt);
                setAbandonedCartPrompt(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-white/90 transition-all"
            >
              Resume
            </button>
            <button
              onClick={() => setAbandonedCartPrompt(null)}
              className="p-1 text-[#888] hover:text-white"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Targeted Notifications Drawer */}
      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onSelectEvent={(eventId) => {
          setNotificationsOpen(false);
          setSelectedEventId(eventId);
        }}
      />

      {ticketsWalletOpen && (
        <TicketsWalletModal
          onClose={() => setTicketsWalletOpen(false)}
        />
      )}

      {organizerPortalOpen && (
        <OrganizerPortal
          onClose={() => setOrganizerPortalOpen(false)}
          onOpenGateScanner={() => {
            setOrganizerPortalOpen(false);
            setGateScannerOpen(true);
          }}
        />
      )}

      {gateScannerOpen && (
        <GateScannerModal
          onClose={() => setGateScannerOpen(false)}
        />
      )}

      {promoterPortalOpen && (
        <PromoterPortal
          onClose={() => setPromoterPortalOpen(false)}
        />
      )}

      {sponsorPortalOpen && (
        <SponsorPortal
          onClose={() => setSponsorPortalOpen(false)}
        />
      )}

      {adminPortalOpen && (
        <AdminPortal
          onClose={() => setAdminPortalOpen(false)}
        />
      )}

      {activePolicy && (
        <PolicyModal
          type={activePolicy}
          onClose={() => setActivePolicy(null)}
        />
      )}

      {loginModalOpen && (
        <LoginModal
          isOpen={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          onBrowseWithoutLogin={() => setLoginModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainApp />
      </SocketProvider>
    </AuthProvider>
  );
}
