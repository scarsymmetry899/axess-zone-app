import express from 'express';
import { db } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { broadcastUserTicketUpdate, broadcastTierUpdate } from '../services/socketService.js';

const router = express.Router();

// GET /api/tickets/my-tickets - Attendee ticket wallet
router.get('/my-tickets', authenticate, (req, res) => {
  const tickets = db.prepare(`
    SELECT t.*,
           e.title as event_title, e.subtitle as event_subtitle,
           e.venue_name, e.venue_address, e.date_display,
           e.banner_url, e.poster_url, e.location_city,
           tt.name as tier_name, tt.price as tier_price,
           o.order_number, o.created_at as purchased_at, o.payment_id
    FROM tickets t
    JOIN events e ON t.event_id = e.id
    JOIN ticket_tiers tt ON t.tier_id = tt.id
    JOIN orders o ON t.order_id = o.id
    WHERE t.user_id = ?
    ORDER BY t.created_at DESC
  `).all(req.user.id);

  // Get orders history
  const orders = db.prepare(`
    SELECT o.*, e.title as event_title, e.date_display
    FROM orders o
    JOIN events e ON o.event_id = e.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `).all(req.user.id);

  res.json({
    tickets,
    orders,
    count: tickets.length
  });
});

// GET /api/tickets/:id - Single pass detail
router.get('/:id', authenticate, (req, res) => {
  const ticket = db.prepare(`
    SELECT t.*,
           e.title as event_title, e.subtitle as event_subtitle,
           e.venue_name, e.venue_address, e.date_display,
           e.banner_url, e.poster_url, e.lat, e.lng,
           tt.name as tier_name, tt.price as tier_price, tt.perks,
           o.order_number, o.final_amount
    FROM tickets t
    JOIN events e ON t.event_id = e.id
    JOIN ticket_tiers tt ON t.tier_id = tt.id
    JOIN orders o ON t.order_id = o.id
    WHERE t.id = ? OR t.ticket_code = ?
  `).get(req.params.id, req.params.id);

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket pass not found.' });
  }

  // Authorization check
  if (req.user.role === 'USER' && ticket.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized to view this ticket pass.' });
  }

  res.json({
    ticket: {
      ...ticket,
      perks: ticket.perks ? JSON.parse(ticket.perks) : []
    }
  });
});

// POST /api/tickets/:id/refund - Process refund for a ticket (ORGANIZER, ADMIN)
router.post('/:id/refund', authenticate, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }

  if (ticket.status === 'REFUNDED') {
    return res.status(400).json({ error: 'Ticket is already refunded.' });
  }

  const refundTx = db.transaction(() => {
    // 1. Mark ticket as REFUNDED
    db.prepare("UPDATE tickets SET status = 'REFUNDED' WHERE id = ?").run(ticket.id);

    // 2. Decrement tier sold count
    db.prepare(`
      UPDATE ticket_tiers
      SET sold_count = MAX(0, sold_count - 1),
          sale_state = CASE WHEN sale_state = 'Sold Out' THEN 'Available Now' ELSE sale_state END
      WHERE id = ?
    `).run(ticket.tier_id);

    // 3. Record audit log
    db.prepare(`
      INSERT INTO audit_logs (id, action, actor_id, details)
      VALUES (?, 'TICKET_REFUND', ?, ?)
    `).run(`aud_${Date.now()}`, req.user.id, `Refunded ticket ${ticket.ticket_code} for order ${ticket.order_id}`);
  });

  refundTx();

  const updatedTier = db.prepare('SELECT * FROM ticket_tiers WHERE id = ?').get(ticket.tier_id);
  broadcastTierUpdate(ticket.event_id, updatedTier);
  broadcastUserTicketUpdate(ticket.user_id, { ticketId: ticket.id, status: 'REFUNDED' });

  res.json({
    message: `Ticket pass ${ticket.ticket_code} refunded successfully. Capacity restored to pool.`,
    ticket: { ...ticket, status: 'REFUNDED' }
  });
});

// POST /api/tickets/:id/transfer - District/DICE style peer-to-peer anti-fraud ticket transfer
router.post('/:id/transfer', authenticate, (req, res) => {
  const { recipientEmail, recipientName, recipientPhone } = req.body;

  if (!recipientEmail) {
    return res.status(400).json({ error: 'Recipient email address is required for ticket transfer.' });
  }

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }

  // Custody verification
  if (ticket.user_id !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'You are not the authorized custodian of this ticket pass.' });
  }

  if (ticket.status !== 'VALID') {
    return res.status(400).json({ error: `Cannot transfer ticket with status: ${ticket.status}. Only VALID passes can be transferred.` });
  }

  if (recipientEmail.toLowerCase() === req.user.email.toLowerCase()) {
    return res.status(400).json({ error: 'Cannot transfer ticket to your own account.' });
  }

  // 1. Resolve or create recipient account
  let recipient = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(recipientEmail);
  if (!recipient) {
    const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, phone)
      VALUES (?, ?, ?, ?, 'USER', ?)
    `).run(
      newUserId,
      recipientEmail.toLowerCase(),
      '$2a$10$9999999999999999999999', // provisional hash until claimed
      recipientName || recipientEmail.split('@')[0],
      recipientPhone || null
    );
    recipient = db.prepare('SELECT * FROM users WHERE id = ?').get(newUserId);
  }

  const newTicketId = `tkt_trf_${Date.now()}`;
  const newTicketCode = `AXS-TRF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const timestamp = new Date().toISOString();

  // Create new signed QR payload for recipient
  const newQrPayload = JSON.stringify({
    ticket_code: newTicketCode,
    event_id: ticket.event_id,
    tier_id: ticket.tier_id,
    attendee_name: recipient.name,
    attendee_email: recipient.email,
    transferred_from: req.user.email,
    issued_at: timestamp,
    sig: `sig_trf_${Math.random().toString(36).substring(2, 18)}`
  });

  const transferTx = db.transaction(() => {
    // 2. Invalidate original ticket (District style anti-duplication)
    db.prepare(`
      UPDATE tickets
      SET status = 'TRANSFERRED',
          qr_payload = json_set(qr_payload, '$.transferred_to', ?, '$.invalidated_at', ?)
      WHERE id = ?
    `).run(recipient.email, timestamp, ticket.id);

    // 3. Issue brand new ticket pass to recipient
    db.prepare(`
      INSERT INTO tickets (
        id, ticket_code, order_id, event_id, tier_id, user_id,
        attendee_name, attendee_email, attendee_phone, security_signature,
        status, qr_payload, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VALID', ?, ?)
    `).run(
      newTicketId,
      newTicketCode,
      ticket.order_id,
      ticket.event_id,
      ticket.tier_id,
      recipient.id,
      recipient.name,
      recipient.email,
      recipient.phone || recipientPhone || null,
      `trf_sec_sig_${Date.now()}`,
      newQrPayload,
      timestamp
    );

    // 4. Audit trail
    db.prepare(`
      INSERT INTO audit_logs (id, action, actor_id, details)
      VALUES (?, 'TICKET_P2P_TRANSFER', ?, ?)
    `).run(
      `aud_trf_${Date.now()}`,
      req.user.id,
      `P2P Ticket Transfer: Pass ${ticket.ticket_code} custody transferred from ${req.user.email} to ${recipient.email}. New pass issued: ${newTicketCode}`
    );
  });

  transferTx();

  const newTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(newTicketId);

  // Real-time socket updates for both parties
  broadcastUserTicketUpdate(req.user.id, { ticketId: ticket.id, status: 'TRANSFERRED' });
  broadcastUserTicketUpdate(recipient.id, newTicket);

  res.json({
    success: true,
    message: `Ticket pass successfully transferred to ${recipient.email}. Previous QR code has been safely invalidated to prevent duplicate entries.`,
    transferredTicket: {
      originalCode: ticket.ticket_code,
      status: 'TRANSFERRED',
      newTicketCode,
      recipientEmail: recipient.email,
      recipientName: recipient.name
    }
  });
});

export default router;
