import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { holdManager } from '../services/holdManager.js';
import { PaymentService } from '../services/paymentService.js';
import { CryptoPass } from '../services/cryptoPass.js';
import { optionalAuth, authenticate } from '../middleware/auth.js';
import { broadcastTierUpdate, broadcastUserTicketUpdate } from '../services/socketService.js';

const router = express.Router();

// POST /api/checkout/hold - Create temporary 8-10 min ticket reservation hold
router.post('/hold', optionalAuth, async (req, res) => {
  try {
    const { tierId, quantity = 1 } = req.body;
    const qty = parseInt(quantity, 10);

    if (!tierId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Valid tierId and quantity are required.' });
    }

    const userId = req.user ? req.user.id : null;
    const hold = await holdManager.createHold(tierId, qty, userId);

    // Fetch updated tier and broadcast live availability
    const updatedTier = db.prepare('SELECT * FROM ticket_tiers WHERE id = ?').get(tierId);
    if (updatedTier) {
      broadcastTierUpdate(updatedTier.event_id, {
        ...updatedTier,
        perks: updatedTier.perks ? (typeof updatedTier.perks === 'string' ? JSON.parse(updatedTier.perks) : updatedTier.perks) : [],
        available_qty: Math.max(0, updatedTier.capacity - (updatedTier.sold_count + updatedTier.reserved_count))
      });
    }

    res.json({
      message: 'Temporary reservation hold created. Complete checkout within the time window.',
      ...hold
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/checkout/hold/:holdToken - Check hold status and remaining TTL seconds
router.get('/hold/:holdToken', (req, res) => {
  const hold = holdManager.validateHold(req.params.holdToken);
  if (!hold) {
    return res.status(404).json({ error: 'Hold expired or not found. Please reserve your tickets again.' });
  }

  res.json({ hold });
});

// DELETE /api/checkout/hold/:holdToken - Release hold explicitly
router.delete('/hold/:holdToken', (req, res) => {
  const hold = holdManager.validateHold(req.params.holdToken);
  const released = holdManager.releaseHold(req.params.holdToken);

  if (hold) {
    const updatedTier = db.prepare('SELECT * FROM ticket_tiers WHERE id = ?').get(hold.tier_id);
    if (updatedTier) {
      broadcastTierUpdate(updatedTier.event_id, {
        ...updatedTier,
        perks: updatedTier.perks ? (typeof updatedTier.perks === 'string' ? JSON.parse(updatedTier.perks) : updatedTier.perks) : [],
        available_qty: Math.max(0, updatedTier.capacity - (updatedTier.sold_count + updatedTier.reserved_count))
      });
    }
  }

  res.json({ message: 'Hold released successfully', released });
});

// POST /api/checkout/validate-promo - Validate promo or promoter affiliate code
router.post('/validate-promo', (req, res) => {
  const { code, eventId, totalAmount = 0 } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'Promo code is required.' });
  }

  const promo = db.prepare(`
    SELECT p.*, u.name as promoter_name
    FROM promo_codes p
    LEFT JOIN users u ON p.promoter_id = u.id
    WHERE UPPER(p.code) = UPPER(?) AND p.is_active = 1
  `).get(code.trim());

  if (!promo) {
    return res.status(404).json({ error: 'Invalid or expired promotional code.' });
  }

  if (promo.event_id && promo.event_id !== eventId) {
    return res.status(400).json({ error: 'This promo code is not applicable to the selected event.' });
  }

  if (promo.current_uses >= promo.max_uses) {
    return res.status(400).json({ error: 'Promo code redemption limit reached.' });
  }

  let discount = 0;
  if (promo.discount_type === 'PERCENT') {
    discount = Math.round((totalAmount * promo.discount_val) / 100);
  } else {
    discount = Math.min(totalAmount, promo.discount_val);
  }

  res.json({
    valid: true,
    code: promo.code,
    discountType: promo.discount_type,
    discountValue: promo.discount_val,
    calculatedDiscount: discount,
    promoterId: promo.promoter_id,
    promoterName: promo.promoter_name
  });
});

// POST /api/checkout/create-order - Create Razorpay payment order backed by valid hold
router.post('/create-order', optionalAuth, async (req, res) => {
  try {
    const {
      holdToken,
      billingName,
      billingEmail,
      billingPhone,
      promoCode,
      idempotencyKey
    } = req.body;

    if (!holdToken || !billingName || !billingEmail || !billingPhone) {
      return res.status(400).json({ error: 'Missing required order fields (holdToken, billing info).' });
    }

    // Check idempotency if key provided
    if (idempotencyKey) {
      const existingOrder = db.prepare('SELECT * FROM orders WHERE idempotency_key = ?').get(idempotencyKey);
      if (existingOrder) {
        return res.json({
          order: existingOrder,
          cached: true
        });
      }
    }

    const hold = holdManager.validateHold(holdToken);
    if (!hold) {
      return res.status(400).json({ error: 'Ticket reservation hold expired. Please reselect your passes.' });
    }

    const tier = db.prepare('SELECT * FROM ticket_tiers WHERE id = ?').get(hold.tier_id);
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(tier.event_id);

    const baseAmount = tier.price * hold.quantity;
    let discountAmount = 0;
    let promoterId = null;

    if (promoCode) {
      const promo = db.prepare('SELECT * FROM promo_codes WHERE UPPER(code) = UPPER(?) AND is_active = 1').get(promoCode.trim());
      if (promo) {
        if (promo.discount_type === 'PERCENT') {
          discountAmount = Math.round((baseAmount * promo.discount_val) / 100);
        } else {
          discountAmount = Math.min(baseAmount, promo.discount_val);
        }
        promoterId = promo.promoter_id;
      }
    }

    const finalAmount = Math.max(0, baseAmount - discountAmount);
    const orderNumber = `AXS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const internalOrderId = `ord_${uuidv4().replace(/-/g, '').substring(0, 16)}`;

    // Create payment gateway order (Razorpay)
    const gatewayOrder = await PaymentService.createOrder({
      amount: finalAmount,
      currency: 'INR',
      receipt: orderNumber,
      notes: {
        event_id: event.id,
        event_title: event.title,
        tier_name: tier.name,
        quantity: hold.quantity,
        hold_token: holdToken
      }
    });

    const userId = req.user ? req.user.id : (hold.user_id || 'user_attendee');

    // Persist pending order
    db.prepare(`
      INSERT INTO orders (
        id, order_number, user_id, event_id, total_amount, discount_amount,
        final_amount, status, payment_provider, payment_id, idempotency_key,
        promo_code, promoter_id, billing_name, billing_email, billing_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      internalOrderId,
      orderNumber,
      userId,
      event.id,
      baseAmount,
      discountAmount,
      finalAmount,
      'PENDING',
      'RAZORPAY',
      gatewayOrder.id,
      idempotencyKey || null,
      promoCode || null,
      promoterId,
      billingName,
      billingEmail,
      billingPhone
    );

    res.json({
      orderId: internalOrderId,
      orderNumber,
      gatewayOrderId: gatewayOrder.id,
      keyId: gatewayOrder.key_id,
      amount: finalAmount,
      currency: 'INR',
      event: {
        id: event.id,
        title: event.title,
        venue: event.venue_name,
        date: event.date_display
      },
      tier: {
        name: tier.name,
        price: tier.price,
        quantity: hold.quantity
      },
      discountAmount,
      remainingHoldSeconds: hold.remainingSeconds
    });
  } catch (err) {
    console.error('[Checkout] Error creating order:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/checkout/verify-payment - Finalize payment, issue crypto-signed passes
router.post('/verify-payment', optionalAuth, async (req, res) => {
  try {
    const {
      orderId,
      holdToken,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ? OR payment_id = ?').get(orderId, razorpay_order_id);
    if (!order) {
      return res.status(404).json({ error: 'Order record not found.' });
    }

    if (order.status === 'COMPLETED') {
      const tickets = db.prepare('SELECT * FROM tickets WHERE order_id = ?').all(order.id);
      return res.json({
        message: 'Order already finalized',
        order,
        tickets
      });
    }

    // Verify payment signature
    const isValid = PaymentService.verifyPaymentSignature({
      razorpay_order_id: razorpay_order_id || order.payment_id,
      razorpay_payment_id: razorpay_payment_id || `pay_mock_${Date.now()}`,
      razorpay_signature: razorpay_signature || 'mock_sig_pass'
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Payment signature verification failed.' });
    }

    const hold = holdManager.validateHold(holdToken);
    const tier = db.prepare('SELECT * FROM ticket_tiers WHERE id = ?').get(hold ? hold.tier_id : null);
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(order.event_id);

    // Commit hold: turns reserved tickets into sold tickets
    if (hold) {
      holdManager.commitHold(holdToken);
    } else if (tier) {
      db.prepare('UPDATE ticket_tiers SET sold_count = sold_count + 1 WHERE id = ?').run(tier.id);
    }

    // Update order status to COMPLETED
    db.prepare(`
      UPDATE orders
      SET status = 'COMPLETED',
          payment_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(razorpay_payment_id || `pay_completed_${Date.now()}`, order.id);

    // Increment promo code usage and promoter stats if used
    if (order.promo_code) {
      db.prepare('UPDATE promo_codes SET current_uses = current_uses + 1 WHERE UPPER(code) = UPPER(?)').run(order.promo_code);
    }

    if (order.promoter_id) {
      const commission = Math.round(order.final_amount * 0.10);
      db.prepare(`
        UPDATE promoter_stats
        SET total_orders = total_orders + 1,
            gross_sales = gross_sales + ?,
            earned_commission = earned_commission + ?
        WHERE promoter_id = ?
      `).run(order.final_amount, commission, order.promoter_id);
    }

    // Generate Scannable Cryptographically Signed Tickets
    const quantity = hold ? hold.quantity : 1;
    const generatedTickets = [];

    const insertTicket = db.prepare(`
      INSERT INTO tickets (
        id, ticket_code, order_id, event_id, tier_id, user_id,
        attendee_name, attendee_email, attendee_phone, security_signature,
        status, qr_payload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < quantity; i++) {
      const ticketId = `tkt_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
      const ticketCode = `AXS-${event.slug.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const qrPayload = CryptoPass.createQRPayload({
        ticketCode,
        orderId: order.id,
        userId: order.user_id,
        eventId: event.id,
        tierId: tier ? tier.id : 'standard_tier',
        eventTitle: event.title,
        tierName: tier ? tier.name : 'General Admission',
        attendeeName: order.billing_name
      });

      const signature = CryptoPass.generateSignature(
        ticketCode,
        order.id,
        order.user_id,
        event.id,
        tier ? tier.id : 'standard_tier'
      );

      insertTicket.run(
        ticketId,
        ticketCode,
        order.id,
        event.id,
        tier ? tier.id : 'standard_tier',
        order.user_id,
        order.billing_name,
        order.billing_email,
        order.billing_phone,
        signature,
        'VALID',
        qrPayload
      );

      generatedTickets.push({
        id: ticketId,
        ticket_code: ticketCode,
        event_title: event.title,
        tier_name: tier ? tier.name : 'General Admission',
        attendee_name: order.billing_name,
        qr_payload: qrPayload,
        status: 'VALID'
      });
    }

    // Broadcast updated tier metrics & user ticket receipt via WebSockets!
    if (tier) {
      const updatedTier = db.prepare('SELECT * FROM ticket_tiers WHERE id = ?').get(tier.id);
      broadcastTierUpdate(event.id, {
        ...updatedTier,
        available_qty: Math.max(0, updatedTier.capacity - (updatedTier.sold_count + updatedTier.reserved_count))
      });
    }

    broadcastUserTicketUpdate(order.user_id, {
      orderId: order.id,
      tickets: generatedTickets
    });

    res.json({
      success: true,
      message: 'Payment verified and passes issued successfully!',
      order: {
        ...order,
        status: 'COMPLETED'
      },
      tickets: generatedTickets
    });
  } catch (err) {
    console.error('[Checkout] Error verifying payment:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
