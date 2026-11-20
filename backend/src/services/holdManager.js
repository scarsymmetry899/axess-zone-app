import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { config } from '../config.js';

class HoldManager {
  constructor() {
    this.memoryHolds = new Map(); // fallback when Redis is not active
    this.intervalId = setInterval(() => this.cleanupExpiredHolds(), 10000); // check every 10s
    console.log('[HoldManager] Initialized with 10-minute hold TTL strategy.');
  }

  /**
   * Reserves a quantity of tickets for a specific tier for 8-10 minutes.
   * Decrements available pool by increasing reserved_count.
   */
  async createHold(tierId, quantity, userId = null) {
    const tier = db.prepare('SELECT * FROM ticket_tiers WHERE id = ?').get(tierId);
    if (!tier) {
      throw new Error('Ticket tier not found');
    }

    if (tier.sale_state !== 'Available Now') {
      throw new Error(`This ticket tier is currently ${tier.sale_state}`);
    }

    const available = tier.capacity - (tier.sold_count + tier.reserved_count);
    if (available < quantity) {
      throw new Error(`Insufficient tickets remaining. Only ${Math.max(0, available)} available.`);
    }

    const holdToken = `hold_${uuidv4().replace(/-/g, '')}`;
    const nowSec = Math.floor(Date.now() / 1000);
    const expiresAt = nowSec + config.holdTtlSeconds;

    // Persist in DB and memory
    const insertHold = db.prepare(`
      INSERT INTO ticket_holds (id, hold_token, tier_id, quantity, user_id, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const updateTier = db.prepare(`
      UPDATE ticket_tiers
      SET reserved_count = reserved_count + ?
      WHERE id = ?
    `);

    // Run transaction
    const executeHold = db.transaction(() => {
      insertHold.run(uuidv4(), holdToken, tierId, quantity, userId, expiresAt);
      updateTier.run(quantity, tierId);
    });

    executeHold();

    this.memoryHolds.set(holdToken, {
      tierId,
      quantity,
      userId,
      expiresAt,
    });

    return {
      holdToken,
      tierId,
      quantity,
      expiresAt,
      ttlSeconds: config.holdTtlSeconds,
    };
  }

  /**
   * Validates if a hold is still valid and not expired.
   */
  validateHold(holdToken) {
    const nowSec = Math.floor(Date.now() / 1000);
    const hold = db.prepare(`
      SELECT th.*, tt.price, tt.name as tier_name, tt.event_id
      FROM ticket_holds th
      JOIN ticket_tiers tt ON th.tier_id = tt.id
      WHERE th.hold_token = ? AND th.expires_at > ?
    `).get(holdToken, nowSec);

    if (!hold) {
      return null;
    }

    return {
      ...hold,
      remainingSeconds: Math.max(0, hold.expires_at - nowSec),
    };
  }

  /**
   * Release hold explicitly (e.g. user closes checkout or changes ticket tier).
   */
  releaseHold(holdToken) {
    const hold = db.prepare('SELECT * FROM ticket_holds WHERE hold_token = ?').get(holdToken);
    if (!hold) return false;

    const executeRelease = db.transaction(() => {
      db.prepare('DELETE FROM ticket_holds WHERE hold_token = ?').run(holdToken);
      db.prepare(`
        UPDATE ticket_tiers
        SET reserved_count = MAX(0, reserved_count - ?)
        WHERE id = ?
      `).run(hold.quantity, hold.tier_id);
    });

    executeRelease();
    this.memoryHolds.delete(holdToken);
    return true;
  }

  /**
   * Commit hold upon successful payment: converts reserved tickets to sold tickets and deletes hold.
   */
  commitHold(holdToken) {
    const hold = db.prepare('SELECT * FROM ticket_holds WHERE hold_token = ?').get(holdToken);
    if (!hold) {
      throw new Error('Hold reservation expired or invalid');
    }

    const executeCommit = db.transaction(() => {
      // 1. Delete hold
      db.prepare('DELETE FROM ticket_holds WHERE hold_token = ?').run(holdToken);
      // 2. Decrement reserved_count and increment sold_count
      db.prepare(`
        UPDATE ticket_tiers
        SET reserved_count = MAX(0, reserved_count - ?),
            sold_count = sold_count + ?
        WHERE id = ?
      `).run(hold.quantity, hold.quantity, hold.tier_id);

      // Check if tier is now sold out
      const tier = db.prepare('SELECT capacity, sold_count FROM ticket_tiers WHERE id = ?').get(hold.tier_id);
      if (tier && tier.sold_count >= tier.capacity) {
        db.prepare("UPDATE ticket_tiers SET sale_state = 'Sold Out' WHERE id = ?").run(hold.tier_id);
      }
    });

    executeCommit();
    this.memoryHolds.delete(holdToken);
    return hold;
  }

  /**
   * Periodic garbage collection of expired holds.
   */
  cleanupExpiredHolds() {
    try {
      const nowSec = Math.floor(Date.now() / 1000);
      const expiredList = db.prepare('SELECT * FROM ticket_holds WHERE expires_at <= ?').all(nowSec);

      if (expiredList.length > 0) {
        const cleanupTx = db.transaction(() => {
          for (const item of expiredList) {
            db.prepare('DELETE FROM ticket_holds WHERE id = ?').run(item.id);
            db.prepare(`
              UPDATE ticket_tiers
              SET reserved_count = MAX(0, reserved_count - ?)
              WHERE id = ?
            `).run(item.quantity, item.tier_id);
            this.memoryHolds.delete(item.hold_token);
          }
        });
        cleanupTx();
        console.log(`[HoldManager] Released ${expiredList.length} expired ticket reservation holds.`);
      }
    } catch (err) {
      console.error('[HoldManager] Error cleaning expired holds:', err);
    }
  }
}

export const holdManager = new HoldManager();
