import express from 'express';
import { db } from '../db.js';

const router = express.Router();

// GET /api/notifications - Retrieve active in-app notifications
router.get('/', (req, res) => {
  const { location, role } = req.query;
  try {
    let query = 'SELECT * FROM notifications WHERE 1=1';
    const params = [];

    if (location && location !== 'ALL') {
      query += ' AND (target_location = ? OR target_location = "ALL")';
      params.push(location);
    }
    if (role && role !== 'ALL') {
      query += ' AND (target_role = ? OR target_role = "ALL")';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC LIMIT 20';
    const notifications = db.prepare(query).all(...params);
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/notifications/track-open
router.post('/track-open', (req, res) => {
  res.json({ success: true });
});

export default router;
