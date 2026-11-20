import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticate, requireRole, optionalAuth } from '../middleware/auth.js';
import { broadcastEventFeedUpdate } from '../services/socketService.js';

const router = express.Router();

// GET /api/events/hero - Marquee events for showcase carousel
router.get('/hero', (req, res) => {
  const heroEvents = db.prepare(`
    SELECT * FROM events
    WHERE is_featured = 1 AND is_past = 0
    ORDER BY created_at ASC
    LIMIT 6
  `).all();

  res.json({ events: heroEvents });
});

// GET /api/events/past - Concluded events archive
router.get('/past', (req, res) => {
  const pastEvents = db.prepare(`
    SELECT * FROM events
    WHERE is_past = 1
    ORDER BY start_date DESC
  `).all();

  res.json({ events: pastEvents });
});

// GET /api/events - List active events with category/location/search filters
router.get('/', (req, res) => {
  const { category, location, search, past } = req.query;

  let query = 'SELECT * FROM events WHERE 1=1';
  const params = [];

  if (past === '1' || past === 'true') {
    query += ' AND is_past = 1';
  } else {
    query += ' AND is_past = 0';
  }

  if (category && category !== 'View All' && category !== 'All') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (location && location !== 'View All' && location !== 'All Locations' && location !== 'All') {
    query += ' AND location_city = ?';
    params.push(location);
  }

  if (search && search.trim()) {
    query += ' AND (title LIKE ? OR subtitle LIKE ? OR venue_name LIKE ? OR description LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  query += ' ORDER BY is_featured DESC, start_date ASC';

  const events = db.prepare(query).all(...params);
  res.json({ events, count: events.length });
});

// GET /api/events/:id - Event detail with all ticket tiers
router.get('/:id', (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ? OR slug = ?').get(req.params.id, req.params.id);

  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const tiers = db.prepare(`
    SELECT * FROM ticket_tiers
    WHERE event_id = ?
    ORDER BY sort_order ASC, price ASC
  `).all(event.id);

  // Parse perks JSON
  const parsedTiers = tiers.map(t => ({
    ...t,
    perks: t.perks ? JSON.parse(t.perks) : [],
    available_qty: Math.max(0, t.capacity - (t.sold_count + t.reserved_count))
  }));

  // Fetch organizer info
  const organizer = event.organizer_id
    ? db.prepare('SELECT id, name, company_name, email FROM users WHERE id = ?').get(event.organizer_id)
    : null;

  res.json({
    event,
    tiers: parsedTiers,
    organizer
  });
});

// POST /api/events - Create new event (ORGANIZER, ADMIN)
router.post('/', authenticate, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  const {
    title,
    subtitle,
    description,
    category,
    location_city,
    venue_name,
    venue_address,
    lat,
    lng,
    banner_url,
    poster_url,
    date_display,
    start_date,
    end_date,
    price_min = 0,
    price_max = 0,
    is_featured = 0,
    tiers = []
  } = req.body;

  if (!title || !description || !category || !location_city || !venue_name || !banner_url) {
    return res.status(400).json({ error: 'Missing required event fields (title, description, category, location, venue, banner).' });
  }

  const eventId = `ev_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + `-${Date.now().toString().slice(-4)}`;

  const createTx = db.transaction(() => {
    db.prepare(`
      INSERT INTO events (
        id, title, subtitle, slug, description, category, location_city,
        venue_name, venue_address, lat, lng, banner_url, poster_url,
        date_display, start_date, end_date, price_min, price_max,
        is_featured, is_past, status, organizer_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      eventId,
      title,
      subtitle || null,
      slug,
      description,
      category,
      location_city,
      venue_name,
      venue_address || venue_name,
      lat || 15.4989, // Default to Goa coordinates if omitted
      lng || 73.8278,
      banner_url,
      poster_url || banner_url,
      date_display || new Date().toDateString(),
      start_date || new Date().toISOString(),
      end_date || null,
      price_min,
      price_max,
      is_featured ? 1 : 0,
      0,
      'PUBLISHED',
      req.user.id
    );

    // Create tiers if provided
    if (tiers && tiers.length > 0) {
      const insertTier = db.prepare(`
        INSERT INTO ticket_tiers (
          id, event_id, name, description, price, capacity,
          sale_state, perks, min_per_order, max_per_order, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      tiers.forEach((t, index) => {
        const tierId = `tier_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
        insertTier.run(
          tierId,
          eventId,
          t.name,
          t.description || null,
          t.price,
          t.capacity || 200,
          t.sale_state || 'Available Now',
          JSON.stringify(t.perks || []),
          t.min_per_order || 1,
          t.max_per_order || 6,
          index + 1
        );
      });
    }
  });

  createTx();

  const newEvent = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId);

  // Broadcast real-time event creation via WebSockets
  broadcastEventFeedUpdate('CREATED', newEvent);

  res.status(201).json({
    message: 'Event published successfully',
    event: newEvent
  });
});

// PUT /api/events/:id - Update event details
router.put('/:id', authenticate, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  // Check ownership
  if (req.user.role !== 'ADMIN' && event.organizer_id !== req.user.id) {
    return res.status(403).json({ error: 'You are not authorized to update this event.' });
  }

  const {
    title,
    subtitle,
    description,
    category,
    location_city,
    venue_name,
    venue_address,
    lat,
    lng,
    banner_url,
    poster_url,
    date_display,
    price_min,
    price_max,
    is_featured,
    status
  } = req.body;

  db.prepare(`
    UPDATE events
    SET title = COALESCE(?, title),
        subtitle = COALESCE(?, subtitle),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        location_city = COALESCE(?, location_city),
        venue_name = COALESCE(?, venue_name),
        venue_address = COALESCE(?, venue_address),
        lat = COALESCE(?, lat),
        lng = COALESCE(?, lng),
        banner_url = COALESCE(?, banner_url),
        poster_url = COALESCE(?, poster_url),
        date_display = COALESCE(?, date_display),
        price_min = COALESCE(?, price_min),
        price_max = COALESCE(?, price_max),
        is_featured = COALESCE(?, is_featured),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title,
    subtitle,
    description,
    category,
    location_city,
    venue_name,
    venue_address,
    lat,
    lng,
    banner_url,
    poster_url,
    date_display,
    price_min,
    price_max,
    is_featured !== undefined ? (is_featured ? 1 : 0) : null,
    status,
    event.id
  );

  const updatedEvent = db.prepare('SELECT * FROM events WHERE id = ?').get(event.id);

  // Broadcast real-time update
  broadcastEventFeedUpdate('UPDATED', updatedEvent);

  res.json({
    message: 'Event updated successfully',
    event: updatedEvent
  });
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', authenticate, requireRole('ORGANIZER', 'ADMIN'), (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  if (req.user.role !== 'ADMIN' && event.organizer_id !== req.user.id) {
    return res.status(403).json({ error: 'You are not authorized to delete this event.' });
  }

  db.prepare('DELETE FROM events WHERE id = ?').run(event.id);

  broadcastEventFeedUpdate('DELETED', event);

  res.json({ message: 'Event removed successfully' });
});

export default router;
