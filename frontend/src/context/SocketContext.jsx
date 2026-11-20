import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState([]);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    s.on('connect', () => {
      console.log('[SocketContext] Connected to Axess real-time pubsub:', s.id);
      setConnected(true);
      s.emit('join', 'events:feed');
    });

    s.on('disconnect', () => {
      console.log('[SocketContext] Disconnected from Axess real-time pubsub');
      setConnected(false);
    });

    // Feed updates
    s.on('events:feed:update', (data) => {
      addAlert({
        id: Date.now(),
        title: `Live Sync: Event ${data.type}`,
        message: data.event?.title || 'Event feed updated in real time.',
        type: 'event'
      });
    });

    // Tier updates
    s.on('tier:change', (data) => {
      addAlert({
        id: Date.now(),
        title: 'Tier Status Updated Live',
        message: `${data.tier.name} is now: ${data.tier.sale_state}`,
        type: 'tier'
      });
    });

    // Targeted custom notifications broadcast
    s.on('broadcast:notification', (data) => {
      const notif = data.notification;
      addAlert({
        id: Date.now(),
        title: notif.title || 'Axess Announcement',
        message: notif.message,
        type: notif.category?.toLowerCase() || 'notification'
      });
      // Also update notification list in local storage for notification center
      try {
        const saved = JSON.parse(localStorage.getItem('axess_notifications') || '[]');
        if (!saved.some(n => n.id === notif.id)) {
          saved.unshift(notif);
          localStorage.setItem('axess_notifications', JSON.stringify(saved));
        }
      } catch (e) {}
    });

    // Upstream website sync status
    s.on('sync:status', (data) => {
      addAlert({
        id: Date.now(),
        title: 'axess.zone Live Sync',
        message: `Successfully synchronized ${data.syncData?.syncedCount || 12} events & ticket matrices with live website.`,
        type: 'sync'
      });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // Subscribe to user ticket channel when logged in
  useEffect(() => {
    if (socket && user?.id) {
      socket.emit('subscribe:user', user.id);

      const handleUserTicketUpdate = (data) => {
        addAlert({
          id: Date.now(),
          title: 'Ticket Issued & Synced',
          message: 'Your passes are ready in Your Tickets wallet.',
          type: 'ticket'
        });
      };

      socket.on(`user:${user.id}:tickets:update`, handleUserTicketUpdate);

      return () => {
        socket.off(`user:${user.id}:tickets:update`, handleUserTicketUpdate);
      };
    }
  }, [socket, user]);

  const addAlert = (alert) => {
    setLiveAlerts((prev) => [alert, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setLiveAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    }, 6000);
  };

  const subscribeToEvent = (eventId) => {
    if (socket && eventId) {
      socket.emit('subscribe:event', eventId);
    }
  };

  const unsubscribeFromEvent = (eventId) => {
    if (socket && eventId) {
      socket.emit('unsubscribe:event', eventId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        liveAlerts,
        subscribeToEvent,
        unsubscribeFromEvent,
        dismissAlert: (id) => setLiveAlerts((prev) => prev.filter((a) => a.id !== id))
      }}
    >
      {children}

      {/* Floating Real-Time Notifications Toast Container (Strictly Monochromatic) */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {liveAlerts.map((alert) => (
          <div
            key={alert.id}
            className="pointer-events-auto bg-[#16171B] border border-[#24262D] text-white p-3.5 rounded-xl shadow-2xl flex items-start gap-3 transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <div className="w-2 h-2 rounded-full bg-white mt-1.5 shrink-0 animate-pulse"></div>
            <div className="flex-1 min-w-0">
              <h5 className="font-grotesk text-[13px] font-bold text-white tracking-tight leading-snug">
                {alert.title}
              </h5>
              <p className="text-[12px] text-[#A1A1AA] mt-0.5 leading-relaxed truncate">
                {alert.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
