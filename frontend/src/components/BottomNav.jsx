import React from 'react';
import { Compass, History, Ticket, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function BottomNav({
  activeTab,
  onTabChange,
  onOpenTickets,
  onOpenAccount
}) {
  const { role } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-black/90 backdrop-blur-md border-t border-[#212121] pb-[env(safe-area-inset-bottom,8px)]">
      <div className="h-16 px-4 flex items-center justify-around">
        {/* Explore */}
        <button
          onClick={() => {
            onTabChange('explore');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center min-w-[56px] gap-1 transition-colors ${
            activeTab === 'explore' ? 'text-white' : 'text-[#606060] hover:text-[#848484]'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[11px] font-heading font-medium">Explore</span>
        </button>

        {/* Past Gigs */}
        <button
          onClick={() => {
            onTabChange('past');
            const el = document.getElementById('past-gigs');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center min-w-[56px] gap-1 transition-colors ${
            activeTab === 'past' ? 'text-white' : 'text-[#606060] hover:text-[#848484]'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[11px] font-heading font-medium">Past Gigs</span>
        </button>

        {/* My Tickets */}
        <button
          onClick={onOpenTickets}
          className="flex flex-col items-center justify-center min-w-[56px] gap-1 text-[#848484] hover:text-white transition-colors"
        >
          <Ticket className="w-5 h-5 text-white" />
          <span className="text-[11px] font-heading font-medium text-white">Tickets</span>
        </button>

        {/* Account / Role */}
        <button
          onClick={onOpenAccount}
          className="flex flex-col items-center justify-center min-w-[56px] gap-1 text-[#606060] hover:text-white transition-colors"
        >
          <User className="w-5 h-5" />
          <span className="text-[11px] font-heading font-medium truncate max-w-[60px]">{role}</span>
        </button>
      </div>
    </nav>
  );
}