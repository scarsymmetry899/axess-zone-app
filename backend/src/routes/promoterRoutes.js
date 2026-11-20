import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/promoters/dashboard - Promoter analytics & commission ledger
router.get('/dashboard', authenticate, requireRole('PROMOTER', 'ADMIN'), (req, res) => {
  const promoterId = req.user.role === 'ADMIN' && req.query.promoterId ? req.query.promoterId : req.user.id;

  let stats = db.prepare('SELECT * FROM promoter_stats WHERE promoter_id = ?').get(promoterId);
  if (!stats) {
    const code = `AXS${Math.floor(1000 + Math.random() * 9000)}`;
    db.prepare(`
      INSERT INTO promoter_stats (id, promoter_id, referral_code)
      VALUES (?, ?, ?)
    `).run(uuidv4(), promoterId, code);
    stats = db.prepare('SELECT * FROM promoter_stats WHERE promoter_id = ?').get(promoterId);
  }

  // Active promo codes
  const codes = db.prepare('SELECT * FROM promo_codes WHERE promoter_id = ?').all(promoterId);

  // Attributed orders
  const orders = db.prepare(`
    SELECT o.id, o.order_number, o.final_amount, o.created_at,
           e.title as event_title, e.date_display,
           ROUND(o.final_amount * 0.10, 2) as commission_earned
    FROM orders o
    JOIN events e ON o.event_id = e.id
    WHERE o.promoter_id = ? AND o.status = 'COMPLETED'
    ORDER BY o.created_at DESC
  `).all(promoterId);

  res.json({
    stats,
    codes,
    orders,
    summary: {
      referralCode: stats.referral_code,
      totalOrders: orders.length,
      grossSales: stats.gross_sales,
      commissionRate: `${Math.round(stats.commission_rate * 100)}%`,
      earnedCommission: stats.earned_commission,
      paidCommission: stats.paid_commission,
      unpaidCommission: Math.max(0, stats.earned_commission - stats.paid_commission)
    }
  });
});

// POST /api/promoters/codes - Generate new custom affiliate code
router.post('/codes', authenticate, requireRole('PROMOTER', 'ADMIN'), (req, res) => {
  const { code, discountVal = 10, discountType = 'PERCENT', eventId = null } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'Code is required' });
  }

  const cleanCode = code.trim().toUpperCase();
  const existing = db.prepare('SELECT id FROM promo_codes WHERE UPPER(code) = ?').get(cleanCode);
  if (existing) {
    return res.status(400).json({ error: 'Code already in use. Please pick another code.' });
  }

  const promoId = `prm_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
  db.prepare(`
    INSERT INTO promo_codes (id, code, discount_type, discount_val, max_uses, promoter_id, event_id)
    VALUES (?, ?, ?, ?, 500, ?, ?)
  `).run(promoId, cleanCode, discountType, discountVal, req.user.id, eventId);

  const newPromo = db.prepare('SELECT * FROM promo_codes WHERE id = ?').get(promoId);
  res.status(201).json({
    message: 'Promoter affiliate code generated successfully',
    promo: newPromo
  });
});

export default router;
