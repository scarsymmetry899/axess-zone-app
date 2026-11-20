import express from 'express';
import { db } from '../db.js';
import { PaymentService } from '../services/paymentService.js';
import { holdManager } from '../services/holdManager.js';
import { CryptoPass } from '../services/cryptoPass.js';
import { broadcastTierUpdate, broadcastEventFeedUpdate, broadcastUserTicketUpdate } from '../services/socketService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// POST /api/webhooks/razorpay - Cryptographically signed payment webhook
router.post('/razorpay', (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = JSON.stringify(req.body);

  // Verify HMAC-SHA256 signature
  const isValid = PaymentService.verifyWebhookSignature(rawBody, signature);
  if (!isValid && process.env.NODE_ENV === 'production') {
    return res.status(400).json({ error: 'Webhook signature verification failed.' });
  }

  const { event, payload } = req.body;
  console.log(`[Webhook:Razorpay] Received event: ${event}`);

  if (event === 'payment.captured' || event === 'order.paid') {
    const paymentEntity = payload?.payment?.entity;
    const gatewayOrderId = paymentEntity?.order_id;
    const paymentId = paymentEntity?.id;

    if (gatewayOrderId) {
      const order = db.prepare('SELECT * FROM orders WHERE payment_id = ?').get(gatewayOrderId);
      if (order && order.status !== 'COMPLETED') {
        db.prepare("UPDATE orders SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(order.id);
        console.log(`[Webhook:Razorpay] Order ${order.id} marked COMPLETED via webhook.`);
      }
    }
  }

  res.json({ status: 'ok', received: true });
});

// POST /api/webhooks/website-sync - Ingest website updates & push to all connected clients
router.post('/website-sync', (req, res) => {
  const { action, eventData, tierData, syncSecret } = req.body;

  // Basic security check for webhook ingestion
  if (syncSecret && syncSecret !== process.env.SYNC_SECRET && process.env.SYNC_SECRET) {
    return res.status(401).json({ error: 'Unauthorized webhook sync call.' });
  }

  console.log(`[Webhook:WebsiteSync] Ingesting website update action: ${action}`);

  if (action === 'UPSERT_EVENT' && eventData) {
    const existing = db.prepare('SELECT id FROM events WHERE id = ? OR slug = ?').get(eventData.id, eventData.slug);

    if (existing) {
      db.prepare(`
        UPDATE events
        SET title = COALESCE(?, title),
            subtitle = COALESCE(?, subtitle),
            description = COALESCE(?, description),
            category = COALESCE(?, category),
            location_city = COALESCE(?, location_city),
            venue_name = COALESCE(?, venue_name),
            banner_url = COALESCE(?, banner_url),
            price_min = COALESCE(?, price_min),
            price_max = COALESCE(?, price_max),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        eventData.title,
        eventData.subtitle,
        eventData.description,
        eventData.category,
        eventData.location_city,
        eventData.venue_name,
        eventData.banner_url,
        eventData.price_min,
        eventData.price_max,
        existing.id
      );

      const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(existing.id);
      broadcastEventFeedUpdate('SYNCED', updated);
    }
  }

  if (action === 'UPDATE_TIER_STATE' && tierData) {
    const { tierId, saleState } = tierData;
    const tier = db.prepare('SELECT * FROM ticket_tiers WHERE id = ?').get(tierId);
    if (tier) {
      db.prepare('UPDATE ticket_tiers SET sale_state = ? WHERE id = ?').run(saleState, tier.id);
      const updated = db.prepare('SELECT * FROM ticket_tiers WHERE id = ?').get(tier.id);
      broadcastTierUpdate(tier.event_id, {
        ...updated,
        available_qty: Math.max(0, updated.capacity - (updated.sold_count + updated.reserved_count))
      });
    }
  }

  res.json({
    success: true,
    message: 'Website sync processed and real-time clients updated.',
    action
  });
});

export default router;
