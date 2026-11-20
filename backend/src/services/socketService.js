let ioInstance = null;

export function initSocketService(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join public events feed
    socket.join('events:feed');

    // Subscribe to a specific event room for real-time tier updates
    socket.on('subscribe:event', (eventId) => {
      if (eventId) {
        socket.join(`event:${eventId}:tiers`);
        console.log(`[Socket.io] Socket ${socket.id} joined event:${eventId}:tiers`);
      }
    });

    socket.on('unsubscribe:event', (eventId) => {
      if (eventId) {
        socket.leave(`event:${eventId}:tiers`);
      }
    });

    // Subscribe to user personal channel (for ticket updates & booking confirmations)
    socket.on('subscribe:user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}:tickets`);
        console.log(`[Socket.io] Socket ${socket.id} joined user:${userId}:tickets`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  console.log('[SocketService] Real-time pub-sub initialized.');
}

export function broadcastEventFeedUpdate(type, event) {
  if (ioInstance) {
    ioInstance.to('events:feed').emit('events:feed:update', {
      type, // 'CREATED', 'UPDATED', 'DELETED', 'SYNCED'
      event,
      timestamp: Date.now()
    });
    console.log(`[SocketService] Broadcasted events:feed:update (${type}) for event: ${event.title}`);
  }
}

export function broadcastTierUpdate(eventId, tier) {
  if (ioInstance) {
    // Broadcast to specific event room
    ioInstance.to(`event:${eventId}:tiers`).emit(`event:${eventId}:tiers:update`, {
      eventId,
      tier,
      timestamp: Date.now()
    });
    // Also broadcast to public feed in case prices/availability badge changed
    ioInstance.to('events:feed').emit('tier:change', { eventId, tier });
    console.log(`[SocketService] Broadcasted tier update for event ${eventId}: tier ${tier.name} -> ${tier.sale_state}`);
  }
}

export function broadcastUserTicketUpdate(userId, ticketOrOrder) {
  if (ioInstance) {
    ioInstance.to(`user:${userId}:tickets`).emit(`user:${userId}:tickets:update`, {
      ticketOrOrder,
      timestamp: Date.now()
    });
    console.log(`[SocketService] Broadcasted ticket update to user:${userId}`);
  }
}

export function broadcastGateCheckIn(eventId, checkInResult) {
  if (ioInstance) {
    ioInstance.emit('gate:checkin', { eventId, checkInResult, timestamp: Date.now() });
  }
}

export function broadcastNotification(notification) {
  if (ioInstance) {
    ioInstance.emit('broadcast:notification', {
      notification,
      timestamp: Date.now()
    });
    console.log(`[SocketService] Broadcasted notification to all clients: ${notification.title}`);
  }
}

export function broadcastSyncStatus(syncData) {
  if (ioInstance) {
    ioInstance.emit('sync:status', {
      syncData,
      timestamp: Date.now()
    });
    console.log(`[SocketService] Broadcasted sync status update: ${syncData.status}`);
  }
}
