import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { broadcastTierUpdate } from '../services/socketService.js';

const router = express.Router();

// PUT /api/tiers/:id/status - Toggle tier between 'Available Now', 'Tier Closed', 'Sold Out'
router.put('/:id/status', authenticate, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  const { sale_state } = req.body;
  const validStates = ['Available Now', 'Tier Closed', 'Sold Out'];

  if (!validStates.includes(sale_state)) {
    return res.status(400).json({ error: `Invalid sale state. Must be one of: ${validStates.join(', ')}` });
  }

  const tier = db.prepare('SELECT * FROM ticket_tiers WHERE id = ?').get(req.params.id);
  if (!tier) {
    return res.status(404).json({ error: 'Ticket tier not found' });
  }

  // Verify organizer ownership unless admin
  if (req.user.role !== 'ADMIN') {
    const event = db.prepare('SELECT organizer_id FROM events WHERE id = ?').get(tier.event_id);
    if (!event || event.organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to modify tiers for this event.' });
    }
  }

  db.prepare('UPDATE ticket_tiers SET sale_state = ? WHERE id = ?').run(sale_state, tier.id);

  const updatedTier = db.prepare('SELECT * FROM ticket_tiers WHERE id = ?').get(tier.id);
  const formattedTier = {
    ...updatedTier,
    perks: updatedTier.perks ? JSON.parse(updatedTier.perks) : [],
    available_qty: Math.max(0, updatedTier.capacity - (updatedTier.sold_count + updatedTier.reserved_count))
  };

  // Broadcast real-time tier update over WebSockets!
  broadcastTierUpdate(tier.event_id, formattedTier);

  res.json({
    message: `Tier state successfully changed to ${sale_state}`,
    tier: formattedTier
  });
});

// PUT /api/tiers/:id - Update tier details (price, capacity, perks)
router.put('/:id', authenticate, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  const tier = db.prepare('SELECT * FROM ticket_tiers WHERE id = ?').get(req.params.id);
  if (!tier) {
    return res.status(404).json({ error: 'Ticket tier not found' });
  }

  const { name, description, price, capacity, perks, sale_state } = req.body;

  db.prepare(`
    UPDATE ticket_tiers
    SET name = COALESCE(?, name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        capacity = COALESCE(?, capacity),
        perks = COALESCE(?, perks),
        sale_state = COALESCE(?, sale_state)
    WHERE id = ?
  `).run(
    name,
    description,
    price,
    capacity,
    perks ? JSON.stringify(perks) : null,
    sale_state,
    tier.id
  );

  const updatedTier = db.prepare('SELECT * FROM ticket_tiers WHERE id = ?').get(tier.id);
  const formattedTier = {
    ...updatedTier,
    perks: updatedTier.perks ? JSON.parse(updatedTier.perks) : [],
    available_qty: Math.max(0, updatedTier.capacity - (updatedTier.sold_count + updatedTier.reserved_count))
  };

  broadcastTierUpdate(tier.event_id, formattedTier);

  res.json({
    message: 'Tier details updated successfully',
    tier: formattedTier
  });
});

// POST /api/tiers/event/:eventId - Add new tier to an event
router.post('/event/:eventId', authenticate, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.eventId);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  if (req.user.role !== 'ADMIN' && event.organizer_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized to add tiers to this event' });
  }

  const { name, description, price, capacity = 100, perks = [], sale_state = 'Available Now' } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Tier name and price are required' });
  }

  const tierId = `tier_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
  db.prepare(`
    INSERT INTO ticket_tiers (
      id, event_id, name, description, price, capacity,
      sale_state, perks, min_per_order, max_per_order, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tierId,
    event.id,
    name,
    description || null,
    price,
    capacity,
    sale_state,
    JSON.stringify(perks),
    1,
    6,
    99
  );

  const newTier = db.prepare('SELECT * FROM ticket_tiers WHERE id = ?').get(tierId);
  const formattedTier = {
    ...newTier,
    perks: newTier.perks ? JSON.parse(newTier.perks) : [],
    available_qty: newTier.capacity
  };

  broadcastTierUpdate(event.id, formattedTier);

  res.status(201).json({
    message: 'New ticket tier created',
    tier: formattedTier
  });
});

export default router;
