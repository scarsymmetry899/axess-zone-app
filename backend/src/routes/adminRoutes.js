import express from 'express';
import { db } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { broadcastEventFeedUpdate } from '../services/socketService.js';

const router = express.Router();

// GET /api/admin/overview - Global platform overview
router.get('/overview', authenticate, requireRole('ADMIN'), (req, res) => {
  const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events WHERE is_past = 0').get().count;
  const totalPastEvents = db.prepare('SELECT COUNT(*) as count FROM events WHERE is_past = 1').get().count;
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalTicketsSold = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE status != "REFUNDED"').get().count;
  const totalCheckedIn = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE status = "CHECKED_IN"').get().count;

  const salesVolume = db.prepare(`
    SELECT COALESCE(SUM(final_amount), 0) as total_gross
    FROM orders
    WHERE status = 'COMPLETED'
  `).get().total_gross;

  const activeHolds = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(quantity), 0) as tickets_held
    FROM ticket_holds
    WHERE expires_at > ?
  `).get(Math.floor(Date.now() / 1000));

  const recentOrders = db.prepare(`
    SELECT o.*, e.title as event_title
    FROM orders o
    JOIN events e ON o.event_id = e.id
    ORDER BY o.created_at DESC
    LIMIT 10
  `).all();

  const userDistribution = db.prepare(`
    SELECT role, COUNT(*) as count
    FROM users
    GROUP BY role
  `).all();

  res.json({
    metrics: {
      totalEvents,
      totalPastEvents,
      totalUsers,
      totalTicketsSold,
      totalCheckedIn,
      grossSalesVolumeINR: salesVolume,
      activeHoldsCount: activeHolds.count,
      activeTicketsHeld: activeHolds.tickets_held,
    },
    userDistribution,
    recentOrders
  });
});

// GET /api/admin/users - User directory
router.get('/users', authenticate, requireRole('ADMIN'), (req, res) => {
  const users = db.prepare(`
    SELECT id, email, name, role, phone, company_name, created_at
    FROM users
    ORDER BY created_at DESC
  `).all();

  res.json({ users });
});

// POST /api/admin/sync-trigger - Simulate CMS / website live sync
router.post('/sync-trigger', authenticate, requireRole('ADMIN'), (req, res) => {
  const { eventId, message } = req.body;

  let event = null;
  if (eventId) {
    event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);
  } else {
    event = db.prepare('SELECT * FROM events WHERE is_past = 0 LIMIT 1').get();
  }

  if (event) {
    // Touch updated_at
    db.prepare('UPDATE events SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(event.id);
    const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(event.id);
    broadcastEventFeedUpdate('SYNCED', updated);
  }

  res.json({
    success: true,
    message: `Triggered live real-time website sync event: ${message || 'Synchronized with upstream axess.zone'}`
  });
});

export default router;
