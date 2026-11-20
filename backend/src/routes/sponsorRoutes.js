import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticate, requireRole, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

const SPONSORSHIP_PACKAGES = [
  {
    tier: 'Headline Presenting Partner',
    priceINR: '₹25,00,000+',
    deliverables: [
      'Event title integration ("Event Presented by [Brand]")',
      'Exclusive 360° main stage physical & laser projection branding',
      'Dedicated 30-person VIP cabana table with premium hospitality',
      'Direct inclusion in all digital passes, emails, and physical wristbands',
      'Custom experiential pop-up activation footprint (10m x 10m)'
    ],
    idealFor: 'Acoustic engineering brands, premier fintech, luxury automotive'
  },
  {
    tier: 'Main Stage Acoustic & Visuals Partner',
    priceINR: '₹12,00,000',
    deliverables: [
      'Naming rights to Secondary Stage or Ambient Glade',
      'Logo presence on all festival screens during transition intervals',
      '15 VIP festival wristbands with backstage terrace passes',
      'Brand feature in Axess official recap documentary and live recordings'
    ],
    idealFor: 'Pro audio gear, beverage, energy drinks, lifestyle apparel'
  },
  {
    tier: 'VIP Lounge & Hospitality Partner',
    priceINR: '₹7,50,000',
    deliverables: [
      'Exclusive branding across elevated VIP terrace and private bars',
      'Custom cocktail creation / branded glassware in VIP areas',
      '10 VIP full-access festival passes',
      'Targeted social media activation across Axess channels'
    ],
    idealFor: 'Artisan craft spirits, boutique hospitality, wellness brands'
  },
  {
    tier: 'Community & Eco-Gathering Partner',
    priceINR: '₹3,50,000',
    deliverables: [
      'Branding on festival hydration stations and eco-cups',
      'Zero-waste village activation footprint',
      '6 General Admission passes with festival merch pack'
    ],
    idealFor: 'Sustainable startups, ecological ventures, community brands'
  }
];

// GET /api/sponsors/packages - Available sponsorship packages
router.get('/packages', (req, res) => {
  res.json({ packages: SPONSORSHIP_PACKAGES });
});

// POST /api/sponsors/inquire - Submit sponsorship inquiry
router.post('/inquire', optionalAuth, (req, res) => {
  const {
    companyName,
    contactPerson,
    email,
    phone,
    eventId,
    packageTier,
    budgetRange,
    message
  } = req.body;

  if (!companyName || !contactPerson || !email || !phone || !eventId || !packageTier) {
    return res.status(400).json({ error: 'Please provide all required inquiry details.' });
  }

  const inqId = `inq_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
  const sponsorId = req.user ? req.user.id : null;

  db.prepare(`
    INSERT INTO sponsorship_inquiries (
      id, sponsor_id, company_name, contact_person, email, phone,
      event_id, package_tier, budget_range, message, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
  `).run(
    inqId,
    sponsorId,
    companyName,
    contactPerson,
    email,
    phone,
    eventId,
    packageTier,
    budgetRange || 'Flexible',
    message || null
  );

  res.status(201).json({
    message: 'Sponsorship inquiry submitted successfully. The Axess partnerships team will connect within 24 hours.',
    inquiryId: inqId
  });
});

// GET /api/sponsors/my-inquiries - List submitted inquiries
router.get('/my-inquiries', authenticate, requireRole('SPONSOR', 'ADMIN'), (req, res) => {
  let query = `
    SELECT si.*, e.title as event_title, e.date_display, e.venue_name
    FROM sponsorship_inquiries si
    JOIN events e ON si.event_id = e.id
  `;
  const params = [];

  if (req.user.role !== 'ADMIN') {
    query += ' WHERE si.sponsor_id = ? OR si.email = ?';
    params.push(req.user.id, req.user.email);
  }

  query += ' ORDER BY si.created_at DESC';

  const inquiries = db.prepare(query).all(...params);
  res.json({ inquiries });
});

export default router;
