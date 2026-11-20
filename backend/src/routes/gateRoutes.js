import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { CryptoPass } from '../services/cryptoPass.js';
import { broadcastGateCheckIn } from '../services/socketService.js';

const router = express.Router();

// POST /api/gate/verify - Scan and validate ticket QR payload or ticket code
router.post('/verify', authenticate, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  const { rawPayload, ticketCode } = req.body;

  let targetCode = ticketCode;

  if (rawPayload) {
    try {
      const parsed = JSON.parse(rawPayload);
      if (parsed.tc) targetCode = parsed.tc;
      else if (parsed.ticket_code) targetCode = parsed.ticket_code;
    } catch {
      targetCode = rawPayload.trim();
    }
  }

  if (!targetCode) {
    return res.status(400).json({
      success: false,
      status: 'INVALID',
      message: 'No readable ticket code or QR payload detected.'
    });
  }

  const ticket = db.prepare(`
    SELECT t.*,
           e.title as event_title, e.venue_name, e.date_display,
           tt.name as tier_name
    FROM tickets t
    JOIN events e ON t.event_id = e.id
    JOIN ticket_tiers tt ON t.tier_id = tt.id
    WHERE UPPER(t.ticket_code) = UPPER(?) OR t.id = ?
  `).get(targetCode, targetCode);

  if (!ticket) {
    return res.status(404).json({
      success: false,
      status: 'NOT_FOUND',
      message: 'Unrecognized ticket code. Pass does not exist in Axess registry.'
    });
  }

  // Check if organizer owns this event unless admin
  if (req.user.role !== 'ADMIN') {
    const event = db.prepare('SELECT organizer_id FROM events WHERE id = ?').get(ticket.event_id);
    if (!event || event.organizer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        status: 'UNAUTHORIZED_VENUE',
        message: 'This pass belongs to a different event organizer.'
      });
    }
  }

  // Check cryptographic HMAC signature
  const isSignatureValid = CryptoPass.verifySignature(
    ticket.ticket_code,
    ticket.order_id,
    ticket.user_id,
    ticket.event_id,
    ticket.tier_id,
    ticket.security_signature
  );

  if (!isSignatureValid) {
    logCheckIn(ticket.id, ticket.ticket_code, ticket.event_id, req.user.id, 'TAMPERED', 'Cryptographic signature mismatch');
    return res.status(400).json({
      success: false,
      status: 'TAMPERED',
      message: 'SECURITY ALERT: Pass cryptographic signature failed verification. Counterfeit suspected.'
    });
  }

  // Check if ticket is refunded
  if (ticket.status === 'REFUNDED') {
    logCheckIn(ticket.id, ticket.ticket_code, ticket.event_id, req.user.id, 'REFUNDED', 'Attempted entry on refunded pass');
    return res.status(400).json({
      success: false,
      status: 'REFUNDED',
      message: 'ENTRY DENIED: This ticket pass was refunded and invalidated.'
    });
  }

  // Check if ticket was transferred to another user (anti-fraud screenshot blocking)
  if (ticket.status === 'TRANSFERRED') {
    logCheckIn(ticket.id, ticket.ticket_code, ticket.event_id, req.user.id, 'TRANSFERRED', 'Attempted entry on transferred pass');
    return res.status(400).json({
      success: false,
      status: 'TRANSFERRED',
      message: 'ENTRY DENIED: This ticket pass was transferred to another user. Original QR code has been revoked.'
    });
  }

  // Check if already checked in (double entry prevention)
  if (ticket.status === 'CHECKED_IN') {
    logCheckIn(ticket.id, ticket.ticket_code, ticket.event_id, req.user.id, 'ALREADY_CHECKED_IN', `Already checked in at ${ticket.checked_in_at}`);
    return res.status(400).json({
      success: false,
      status: 'ALREADY_CHECKED_IN',
      message: `DOUBLE ENTRY BLOCKED: Already admitted at ${ticket.checked_in_at}`,
      ticket: {
        attendee_name: ticket.attendee_name,
        ticket_code: ticket.ticket_code,
        tier_name: ticket.tier_name,
        checked_in_at: ticket.checked_in_at
      }
    });
  }

  // Successful admission: update status to CHECKED_IN
  const nowIso = new Date().toISOString();
  db.prepare(`
    UPDATE tickets
    SET status = 'CHECKED_IN',
        checked_in_at = ?
    WHERE id = ?
  `).run(nowIso, ticket.id);

  logCheckIn(ticket.id, ticket.ticket_code, ticket.event_id, req.user.id, 'SUCCESS', 'Admission granted');

  const checkInResult = {
    success: true,
    status: 'ADMITTED',
    message: 'ENTRY GRANTED: Pass valid and authenticated.',
    admittedAt: nowIso,
    ticket: {
      id: ticket.id,
      ticket_code: ticket.ticket_code,
      attendee_name: ticket.attendee_name,
      attendee_phone: ticket.attendee_phone,
      tier_name: ticket.tier_name,
      event_title: ticket.event_title,
      venue_name: ticket.venue_name,
      checked_in_at: nowIso
    }
  };

  broadcastGateCheckIn(ticket.event_id, checkInResult);

  res.json(checkInResult);
});

// GET /api/gate/event/:eventId/stats - Live door check-in statistics
router.get('/event/:eventId/stats', authenticate, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  const totalSold = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE event_id = ? AND status != "REFUNDED"').get(req.params.eventId).count;
  const totalCheckedIn = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE event_id = ? AND status = "CHECKED_IN"').get(req.params.eventId).count;

  const logs = db.prepare(`
    SELECT cl.*, t.attendee_name, tt.name as tier_name
    FROM checkin_logs cl
    LEFT JOIN tickets t ON cl.ticket_id = t.id
    LEFT JOIN ticket_tiers tt ON t.tier_id = tt.id
    WHERE cl.event_id = ?
    ORDER BY cl.created_at DESC
    LIMIT 20
  `).all(req.params.eventId);

  res.json({
    eventId: req.params.eventId,
    totalSold,
    totalCheckedIn,
    pendingArrivals: Math.max(0, totalSold - totalCheckedIn),
    turnoutPercentage: totalSold > 0 ? Math.round((totalCheckedIn / totalSold) * 100) : 0,
    recentLogs: logs
  });
});

function logCheckIn(ticketId, ticketCode, eventId, scannedById, status, message) {
  try {
    db.prepare(`
      INSERT INTO checkin_logs (id, ticket_id, ticket_code, event_id, scanned_by_id, status, message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), ticketId, ticketCode, eventId, scannedById, status, message);
  } catch (err) {
    console.error('[Gate] Error writing checkin log:', err);
  }
}

export default router;
