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
        onOpenTickets={() => setTicketsWalletOpen(true)}
        onOpenOrganizer={() => setOrganizerPortalOpen(true)}
        onOpenPromoter={() => setPromoterPortalOpen(true)}
        onOpenSponsor={() => setSponsorPortalOpen(true)}
        onOpenAdmin={() => setAdminPortalOpen(true)}
        onOpenGateScanner={() => setGateScannerOpen(true)}
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
          onProceedToCheckout={(data) => {
            setSelectedEventId(null);
            setCheckoutData(data);
          }}
        />
      )}

      {checkoutData && (
        <CheckoutModal
          checkoutData={checkoutData}
          onClose={() => setCheckoutData(null)}
          onOrderCompleted={() => {
            setTicketsWalletOpen(true);
          }}
        />
      )}

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
