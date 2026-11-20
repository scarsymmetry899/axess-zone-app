import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../axess.db');

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
  console.log('[Database] Initializing Axess schema on SQLite (WAL mode)...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      phone TEXT,
      company_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      location_city TEXT NOT NULL,
      venue_name TEXT NOT NULL,
      venue_address TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      banner_url TEXT NOT NULL,
      poster_url TEXT NOT NULL,
      date_display TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      price_min INTEGER NOT NULL DEFAULT 0,
      price_max INTEGER NOT NULL DEFAULT 0,
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_past INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'PUBLISHED',
      organizer_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS ticket_tiers (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      capacity INTEGER NOT NULL,
      sold_count INTEGER NOT NULL DEFAULT 0,
      reserved_count INTEGER NOT NULL DEFAULT 0,
      sale_state TEXT NOT NULL DEFAULT 'Available Now',
      perks TEXT,
      min_per_order INTEGER NOT NULL DEFAULT 1,
      max_per_order INTEGER NOT NULL DEFAULT 10,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ticket_holds (
      id TEXT PRIMARY KEY,
      hold_token TEXT UNIQUE NOT NULL,
      tier_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      user_id TEXT,
      expires_at INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tier_id) REFERENCES ticket_tiers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS promo_codes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL DEFAULT 'PERCENT',
      discount_val REAL NOT NULL,
      max_uses INTEGER NOT NULL DEFAULT 1000,
      current_uses INTEGER NOT NULL DEFAULT 0,
      promoter_id TEXT,
      event_id TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (promoter_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      total_amount REAL NOT NULL,
      discount_amount REAL NOT NULL DEFAULT 0,
      final_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      payment_provider TEXT NOT NULL DEFAULT 'RAZORPAY',
      payment_id TEXT,
      idempotency_key TEXT UNIQUE,
      promo_code TEXT,
      promoter_id TEXT,
      billing_name TEXT NOT NULL,
      billing_email TEXT NOT NULL,
      billing_phone TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      ticket_code TEXT UNIQUE NOT NULL,
      order_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      tier_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      attendee_name TEXT NOT NULL,
      attendee_email TEXT NOT NULL,
      attendee_phone TEXT,
      security_signature TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'VALID',
      checked_in_at DATETIME,
      qr_payload TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (tier_id) REFERENCES ticket_tiers(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS promoter_stats (
      id TEXT PRIMARY KEY,
      promoter_id TEXT UNIQUE NOT NULL,
      referral_code TEXT NOT NULL,
      total_clicks INTEGER NOT NULL DEFAULT 0,
      total_orders INTEGER NOT NULL DEFAULT 0,
      gross_sales REAL NOT NULL DEFAULT 0,
      commission_rate REAL NOT NULL DEFAULT 0.10,
      earned_commission REAL NOT NULL DEFAULT 0,
      paid_commission REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (promoter_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sponsorship_inquiries (
      id TEXT PRIMARY KEY,
      sponsor_id TEXT,
      company_name TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      event_id TEXT NOT NULL,
      package_tier TEXT NOT NULL,
      budget_range TEXT,
      message TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sponsor_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS checkin_logs (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      ticket_code TEXT NOT NULL,
      event_id TEXT NOT NULL,
      scanned_by_id TEXT,
      status TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      actor_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      target_location TEXT NOT NULL DEFAULT 'ALL',
      target_role TEXT NOT NULL DEFAULT 'ALL',
      action_link TEXT,
      priority TEXT NOT NULL DEFAULT 'NORMAL',
      category TEXT DEFAULT 'ANNOUNCEMENT',
      recipient_count INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS retargeting_campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      segment_type TEXT NOT NULL,
      filter_location TEXT DEFAULT 'ALL',
      discount_code TEXT,
      discount_percent INTEGER DEFAULT 10,
      message_template TEXT NOT NULL,
      auto_trigger INTEGER NOT NULL DEFAULT 1,
      idle_hours INTEGER DEFAULT 2,
      total_reached INTEGER DEFAULT 0,
      total_converted INTEGER DEFAULT 0,
      recovered_revenue REAL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS abandoned_carts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_email TEXT,
      user_phone TEXT,
      event_id TEXT NOT NULL,
      tier_id TEXT NOT NULL,
      event_title TEXT,
      tier_name TEXT,
      quantity INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS website_sync_logs (
      id TEXT PRIMARY KEY,
      source_url TEXT NOT NULL DEFAULT 'https://www.axess.zone',
      sync_type TEXT NOT NULL,
      status TEXT NOT NULL,
      entities_synced INTEGER DEFAULT 0,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedData();
  seedFeatureData();
}

export function seedFeatureData() {
  const notifCount = db.prepare('SELECT COUNT(*) as count FROM notifications').get().count;
  if (notifCount === 0) {
    db.prepare(`
      INSERT INTO notifications (id, title, message, target_location, target_role, action_link, priority, category, recipient_count)
      VALUES 
      ('notif_1', '⚡ Final Phase Passes for Primal Void', 'Only 14 Tier 2 passes remaining for Primal Void at House of Chapora. Secure your tickets before tier closure.', 'Goa', 'ALL', 'ev_primal_void', 'HIGH', 'ANNOUNCEMENT', 184),
      ('notif_2', '✨ UNMADA VARA NYE VIP Loyalty Access', 'Loyalty members get complimentary backstage lounge access when booking Tier 2 or 3 this weekend.', 'ALL', 'USER', 'ev_unmada_nye', 'NORMAL', 'OFFER', 412),
      ('notif_3', '📍 Kasol Perseverance Festival Venue Advisory', 'Shuttle services from Kasol central circle will operate round the clock. Check live map for gate entry.', 'Kasol', 'ALL', 'ev_perseverance', 'URGENT', 'ALERT', 96)
    `).run();
  }

  const retargetCount = db.prepare('SELECT COUNT(*) as count FROM retargeting_campaigns').get().count;
  if (retargetCount === 0) {
    db.prepare(`
      INSERT INTO retargeting_campaigns (id, name, segment_type, filter_location, discount_code, discount_percent, message_template, auto_trigger, idle_hours, total_reached, total_converted, recovered_revenue, is_active)
      VALUES
      ('retarget_1', 'Automated Cart Recovery (1 Hour)', 'ABANDONED_CART', 'ALL', 'AXESS10', 10, 'Hey {{name}}, your tickets for {{event_title}} are still held! Complete your checkout in the next 15 mins with 10% off.', 1, 1, 86, 29, 87400, 1),
      ('retarget_2', 'Post-Gig Loyalty Invite (Redeemed Passes)', 'REDEEMED_TICKETS', 'Goa', 'LOYALTY15', 15, 'Loved your night at House of Chapora? Unlock 15% VIP discount on next week’s Primal Void ritual.', 1, 24, 142, 48, 168000, 1),
      ('retarget_3', 'Engaged Nightlife Browsers', 'ENGAGED_BROWSERS', 'Bangalore', 'BLRVIP', 12, 'Noticed you checking out upcoming Bangalore nightlife gigs. Here is an exclusive early-bird tier access code.', 0, 48, 52, 11, 41250, 1)
    `).run();
  }

  const syncLogsCount = db.prepare('SELECT COUNT(*) as count FROM website_sync_logs').get().count;
  if (syncLogsCount === 0) {
    db.prepare(`
      INSERT INTO website_sync_logs (id, source_url, sync_type, status, entities_synced, details)
      VALUES
      ('sync_log_1', 'https://www.axess.zone', 'SCHEDULED_CRON', 'SUCCESS', 12, 'Automated periodic synchronization with axess.zone: Synced 5 marquee gigs, 7 past events, 18 ticket tiers, and S3 CDN media.'),
      ('sync_log_2', 'https://www.axess.zone', 'WEBHOOK', 'SUCCESS', 3, 'Webhook ingestion action UPDATE_TIER_STATE: Primal Void Tier 1 marked closed, Tier 2 opened at ₹4,999.'),
      ('sync_log_3', 'https://www.axess.zone', 'MANUAL', 'SUCCESS', 12, 'Manual App Owner upstream crawl of axess.zone: All venue coordinates, prices, and high-res posters refreshed.')
    `).run();
  }

  const cartCount = db.prepare('SELECT COUNT(*) as count FROM abandoned_carts').get().count;
  if (cartCount === 0) {
    db.prepare(`
      INSERT INTO abandoned_carts (id, user_id, user_email, user_phone, event_id, tier_id, event_title, tier_name, quantity, total_amount, status)
      VALUES
      ('cart_101', 'user_attendee', 'attendee@axess.zone', '+91 98765 43210', 'ev_primal_void', 'tier_primal_tier2', 'Primal Void', 'Tier 2 (Available Now)', 2, 9998, 'OPEN'),
      ('cart_102', 'user_202', 'kabir.mehta@gmail.com', '+91 98201 12345', 'ev_unmada_nye', 'tier_unmada_p2', 'UNMADA VARA NYE', 'Tier 2 (Phase 2)', 1, 2999, 'OPEN'),
      ('cart_103', 'user_303', 'ananya.s@outlook.com', '+91 99100 54321', 'ev_perseverance', 'tier_persevere_ga', 'Perseverance Festival', 'Phase 1 Festival Pass', 2, 4998, 'OPEN')
    `).run();
  }
}

export function seedData(force = false) {
  if (force) {
    db.prepare('DELETE FROM ticket_holds').run();
    db.prepare('DELETE FROM tickets').run();
    db.prepare('DELETE FROM orders').run();
    db.prepare('DELETE FROM ticket_tiers').run();
    db.prepare('DELETE FROM events').run();
    db.prepare('DELETE FROM promo_codes').run();
    db.prepare('DELETE FROM promoter_stats').run();
    db.prepare('DELETE FROM users').run();
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0 && !force) {
    console.log('[Database] Axess database already populated.');
    return;
  }

  console.log('[Database] Seeding authentic axess.zone images and live events...');

  const passwordHash = bcrypt.hashSync('axess123', 10);

  // 1. Seed demo users
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, phone, company_name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const demoUsers = [
    ['user_attendee', 'attendee@axess.zone', passwordHash, 'Arjun Patel', 'USER', '+91 98765 43210', null],
    ['user_organizer', 'organizer@axess.zone', passwordHash, 'Temple Twister Records', 'ORGANIZER', '+91 99887 76655', 'Temple Twister & HillTop Productions'],
    ['user_promoter', 'promoter@axess.zone', passwordHash, 'RaveConnect Goa', 'PROMOTER', '+91 91234 56789', 'RaveConnect Promoters Collective'],
    ['user_sponsor', 'sponsor@axess.zone', passwordHash, 'Void Acoustics India', 'SPONSOR', '+91 98111 22334', 'Void Sound Labs India Pvt Ltd'],
    ['user_admin', 'admin@axess.zone', passwordHash, 'Axess Platform Ops', 'ADMIN', '+91 99999 88888', 'Axess Zone Global'],
  ];

  for (const u of demoUsers) {
    insertUser.run(...u);
  }

  // 2. Promoter stats & promo codes
  db.prepare(`
    INSERT INTO promoter_stats (id, promoter_id, referral_code, total_clicks, total_orders, gross_sales, commission_rate, earned_commission, paid_commission)
    VALUES ('ps_1', 'user_promoter', 'AXESS10', 142, 18, 54900, 0.10, 5490, 2000)
  `).run();

  const insertPromo = db.prepare(`
    INSERT INTO promo_codes (id, code, discount_type, discount_val, max_uses, current_uses, promoter_id, event_id, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPromo.run('promo_1', 'AXESS10', 'PERCENT', 10, 500, 18, 'user_promoter', null, 1);
  insertPromo.run('promo_2', 'EARLYBIRD', 'FLAT', 500, 200, 34, null, null, 1);
  insertPromo.run('promo_3', 'TECHNO20', 'PERCENT', 20, 50, 12, null, null, 1);

  // 3. Seed Marquee & Upcoming Events using EXACT AWS S3 images from axess.zone
  const insertEvent = db.prepare(`
    INSERT INTO events (
      id, title, subtitle, slug, description, category, location_city,
      venue_name, venue_address, lat, lng, banner_url, poster_url,
      date_display, start_date, end_date, price_min, price_max,
      is_featured, is_past, status, organizer_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const events = [
    // 1. UNMADA VARA NYE
    [
      'ev_unmada_nye',
      'UNMADA VARA NYE - The Pulse of Prāṇa',
      'The Pulse of Prāṇa',
      'unmada-vara-goa',
      'Unmada Vara: The Pulse of Prāṇa\n\nLast time, we stepped into the blessing of madness — into intensity, into letting go. But intensity alone doesn’t sustain. This New Year’s, we move into the next state: Prāṇa, the vital life force. Curated by Temple Twister & HillTop with multi-stage Void Acoustics audio reinforcement.',
      'Festival',
      'Goa',
      'HillTop Goa',
      'Ozran Beach Road, Vagator, Goa 403509',
      15.5978,
      73.7432,
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1790489323768-UV_AXESS_BANNER_V01-banner-1790489323506.webp',
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1790489303512-uv_27_axess_post-poster-1790489302740.webp',
      'Dec 31, 2026 – Jan 02, 2027',
      '2026-12-31T18:00:00Z',
      '2027-01-02T12:00:00Z',
      2999,
      24999,
      1,
      0,
      'PUBLISHED',
      'user_organizer'
    ],
    // 2. Primal Void
    [
      'ev_primal_void',
      'Primal Void',
      'Dimensional Magic Tribe Presents — Primal Void',
      'primal-void-24-december-2026-goa-bfkd7n',
      'A nocturnal descent into raw hypnotic techno and relentless bass frequencies. Primal Void occupies the iconic open-air amphitheatric cliff of D Pedro, commanding an intimate communion of underground purists, monolithic modular synthesizers, and unbroken hypnotic flow.',
      'Nightlife',
      'Goa',
      'D Pedro, Goa',
      'Baina Beach Clifftop, D Pedro, Vasco Da Gama, Goa 403802',
      15.3950,
      73.8115,
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1786374548635-Primal_void2-banner-1786374548126.webp',
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1786374542167-Primal_void_1-poster-1786374541397.webp',
      'Dec 24 – 26, 2026',
      '2026-12-24T20:00:00Z',
      '2026-12-26T06:00:00Z',
      1499,
      4999,
      1,
      0,
      'PUBLISHED',
      'user_organizer'
    ],
    // 3. Perseverance Festival
    [
      'ev_perseverance',
      'Perseverance Festival',
      'Winter Solstice Assembly',
      'perseverance-goa',
      'Perseverance embodies endurance through acoustic power. Gathering international audio pioneers for three unforgettable sunsets and sunrises over the river inlet at House of Chapora. Immersive visual arts, artisan markets, high-fidelity sound.',
      'Festival',
      'Goa',
      'D Pedro, Goa',
      'Chapora Jetty, Chapora, Goa 403509',
      15.6042,
      73.7388,
      'https://axess-dev.s3.ap-south-1.amazonaws.com/axess-images/migrated-events/perseverance-goa-banner.png',
      'https://axess-dev.s3.ap-south-1.amazonaws.com/axess-images/migrated-events/perseverance-goa-poster.png',
      'Jan 15 – 17, 2027',
      '2027-01-15T16:00:00Z',
      '2027-01-17T23:59:00Z',
      3200,
      8500,
      1,
      0,
      'PUBLISHED',
      'user_organizer'
    ],
    // 4. Vanaghotra The Decade Ritual
    [
      'ev_vanaghotra',
      'Vanaghotra The Decade Ritual',
      '10 Years of Primal Resonance',
      'vanaghotra-the-decade-ritual-goa',
      'A milestone decade gathering celebrating the raw spirit of Goa trance. Perched directly over the waves with sacred fire ceremonies, experimental visual projection art, and unadulterated high-velocity frequencies.',
      'Community',
      'Goa',
      'Dpedro, Goa',
      'Anjuna Beach, Monteiro Vaddo, Anjuna, Goa 403509',
      15.5786,
      73.7410,
      'https://axess-dev.s3.ap-south-1.amazonaws.com/axess-images/migrated-events/vanaghotra-the-decade-ritual-goa-banner.png',
      'https://axess-dev.s3.ap-south-1.amazonaws.com/axess-images/migrated-events/vanaghotra-the-decade-ritual-goa-poster.jpeg',
      'Feb 05 – 08, 2027',
      '2027-02-05T17:00:00Z',
      '2027-02-08T06:00:00Z',
      2500,
      6000,
      1,
      0,
      'PUBLISHED',
      'user_organizer'
    ],
    // 5. Dark Obscura
    [
      'ev_dark_obscura',
      'Dark Obscura',
      'Occult Hypnotic Gathering',
      'dark-obscura-k58zoa',
      'THE WAIT IS OVER. THE DARKNESS IS COMPLETE. MAGIK BEYOND MUSIC UNLEASHES THE FULL & FINAL LINEUP FOR DARK OBSCURA. Void Acoustics tuned sub-woofers pushing 32Hz pressure, strictly no-flash photography policy, curated for true nocturnal wanderers.',
      'Music',
      'Goa',
      'D Pedro, Goa',
      'Baina Clifftop, D Pedro, Goa 403802',
      15.3950,
      73.8115,
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1793193399009-IMG_1104-banner-1793193398570.webp',
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1794902930662-IMG_1643-poster-1794902929792.webp',
      'Nov 21, 2026',
      '2026-11-21T21:00:00Z',
      '2026-11-22T08:00:00Z',
      1999,
      2499,
      1,
      0,
      'PUBLISHED',
      'user_organizer'
    ],
    // 6. Ritual Of The Void Goa
    [
      'ev_ritual_void',
      'Ritual Of The Void Goa',
      'Nocturnal Sanctuary',
      'ritual-of-the-void-6-goa',
      'The sixth edition of Ritual of the Void at Dpedro, commanding hypnotic rhythms and modular synth live sessions.',
      'Nightlife',
      'Goa',
      'Dpedro, Goa',
      'D Pedro, Goa 403802',
      15.3950,
      73.8115,
      'https://axess-dev.s3.ap-south-1.amazonaws.com/axess-images/migrated-events/ritual-of-the-void-6-goa-banner.jpeg',
      'https://axess-dev.s3.ap-south-1.amazonaws.com/axess-images/migrated-events/ritual-of-the-void-6-goa-poster.jpeg',
      'Dec 18, 2026',
      '2026-12-18T20:00:00Z',
      '2026-12-19T06:00:00Z',
      1500,
      2500,
      1,
      0,
      'PUBLISHED',
      'user_organizer'
    ],
    // 7. Hentai Cameraman (Oceans Pirates Cafe, Goa)
    [
      'ev_hentai_goa',
      'Hentai Cameraman',
      'Live Bass & Visual Showcase',
      'hentai-cameraman-rvuecr',
      'Visual performance and sonic assault live at Oceans Pirates Cafe with immersive projections and custom lighting.',
      'Music',
      'Goa',
      'Oceans Pirates Cafe, Goa',
      'Ozran Beach, Vagator, Goa 403509',
      15.5978,
      73.7432,
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1794571967371-AXESS_HENTAI-banner-1794571967115.webp',
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1794571963558-AXESS-poster-1794571963006.webp',
      'Nov 27, 2026',
      '2026-11-27T15:30:00Z',
      '2026-11-28T03:30:00Z',
      1200,
      2000,
      0,
      0,
      'PUBLISHED',
      'user_organizer'
    ],
    // 8. Hentaicameraman - Bengaluru (GYLT)
    [
      'ev_hentai_blr',
      'Hentaicameraman - Bengaluru',
      'Industrial Audio-Visual Gathering',
      'hentaicameraman-bengaluru-bmmeet',
      'GYLT Bangalore welcomes the raw audiovisual phenomenon of Hentaicameraman with heavy low frequencies and strobe synchronicity.',
      'Music',
      'Bangalore',
      'GYLT, Bangalore',
      'Hennur Bagalur Main Rd, Bangalore 560077',
      13.0428,
      77.6437,
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1794836750639-1000913049-banner-1794836750362.webp',
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1794836741508-1000913048-poster-1794836740960.webp',
      'Nov 28, 2026',
      '2026-11-28T12:30:00Z',
      '2026-11-28T19:30:00Z',
      999,
      1800,
      0,
      0,
      'PUBLISHED',
      'user_organizer'
    ],
    // 9. INVENTION INTENTION
    [
      'ev_invention',
      '⟡ I N V E N T I O N ⟡ I N T E N T I O N ⟡',
      'Psychedelic Frequency Alchemy',
      '-i-n-v-e-n-t-i-o-n-i-n-t-e-n-t-i-o-n--zidvut',
      'Two full nights of exploratory sonic architecture at D Pedro clifftop, bringing together producers, acoustic researchers, and movement practitioners.',
      'Festival',
      'Goa',
      'D Pedro, Goa',
      'Baina Beach Clifftop, D Pedro, Goa 403802',
      15.3950,
      73.8115,
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1794917933069-INVENTION_INTENTION_FLYER_DESIGN_MAIN__1600_x_600_px_-banner-1794917932622.webp',
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1794493593650-axess_INVENTION_INTENTION_FLYER_DESIGN_MAIN__1_-poster-1794493592997.webp',
      'Dec 05 – 07, 2026',
      '2026-12-05T12:05:00Z',
      '2026-12-07T05:05:00Z',
      2499,
      5999,
      0,
      0,
      'PUBLISHED',
      'user_organizer'
    ],
    // 10. Maleficus Noctis
    [
      'ev_maleficus',
      'Maleficus Noctis',
      'Nocturnal Darkpsy Gathering',
      'maleficus-noctis-v11ouu',
      'A winter nocturnal gathering deep inside Dpedro with high-speed forest and dark psy frequencies.',
      'Nightlife',
      'Goa',
      'Dpedro, Goa',
      'D Pedro Clifftop, Vasco, Goa 403802',
      15.3950,
      73.8115,
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1794415262541-1000168055-banner-1794415262171.webp',
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1794415080656-1000168036-poster-1794415080124.webp',
      'Dec 19 – 21, 2026',
      '2026-12-19T14:30:00Z',
      '2026-12-21T04:30:00Z',
      1999,
      3500,
      0,
      0,
      'PUBLISHED',
      'user_organizer'
    ],
    // 11. ONCE IN A XMOON – XMAS EDITION
    [
      'ev_xmoon',
      'ONCE IN A XMOON – XMAS EDITION',
      'House Of Chapora Christmas',
      'once-in-a-xmoon-xmas-edition-cgzlde',
      'Christmas nocturnal celebration over the Chapora river with curated melodic, progressive and peak-time hypnotic electronic sets.',
      'Music',
      'Goa',
      'House Of Chapora, Goa',
      'Chapora Jetty, Goa 403509',
      15.6042,
      73.7388,
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1793642820752-once_in_a_xmoon_axess_banner.jpg-banner-1793642820343.webp',
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1793642817194-once_in_a_xmoon_axess_post-poster-1793642816624.webp',
      'Dec 25, 2026',
      '2026-12-25T14:30:00Z',
      '2026-12-26T00:30:00Z',
      1500,
      3000,
      0,
      0,
      'PUBLISHED',
      'user_organizer'
    ],

    // PAST GIGS (concluded events with real S3 images from axess.zone)
    [
      'ev_past_harmonic',
      'Harmonic Decibels 15.0: Tech to Trance Edition',
      'Saturday Riot at House of Chapora',
      'harmonic-decibels-150-tech-to-trance-edition-s507rz',
      'Concluded gathering at House of Chapora. A dancefloor riot moving from driving tech to transcendent Goa trance.',
      'Music',
      'Goa',
      'House Of Chapora, Goa',
      'Chapora Jetty, Goa 403509',
      15.6042,
      73.7388,
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1794232268606-HARMONIC_DECIBELS_15.0_-_axess_Banner.jpg-banner-1794232267578.webp',
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1794232271539-HARMONIC_DECIBELS_15.0_-_axess_post.jpg-poster-1794232269827.webp',
      'Nov 14, 2026 | House Of Chapora, Goa',
      '2026-11-14T14:30:00Z',
      '2026-11-15T02:00:00Z',
      1200,
      2500,
      0,
      1,
      'PUBLISHED',
      'user_organizer'
    ],
    [
      'ev_past_neverending',
      'Never Ending Seasons 9.0',
      'Coastal Convergence',
      'never-ending-seasons-90',
      'Concluded edition at Oceans Pirates Cafe overlooking Vagator waves.',
      'Nightlife',
      'Goa',
      'Oceans Pirates Cafe, Goa',
      'Ozran Beach, Vagator, Goa 403509',
      15.5978,
      73.7432,
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1794231608194-Never_Ending_Seasons_9.0_-_Axess_Banner.jpg-banner-1794231606922.webp',
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1794231604568-Never_Ending_Seasons_9.0_-_axess_post.jpg-poster-1794231604018.webp',
      'Nov 13, 2026 | Oceans Pirates Cafe, Goa',
      '2026-11-13T14:30:00Z',
      '2026-11-14T02:00:00Z',
      999,
      1800,
      0,
      1,
      'PUBLISHED',
      'user_organizer'
    ],
    [
      'ev_past_postmodern',
      'POST MODERN MUSIC SHOWCASE',
      'Avant-Garde Audio',
      'post-modern-music-showcase',
      'Concluded electronic music showcase at GYLT, Bangalore.',
      'Music',
      'Bangalore',
      'GYLT, Bangalore',
      'Hennur Bagalur Main Rd, Bangalore 560077',
      13.0428,
      77.6437,
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1793171080809-1000899515-banner-1793171080492.webp',
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1793171071013-1000899518-poster-1793171070617.webp',
      'Nov 13, 2026 | GYLT, Bangalore',
      '2026-11-13T13:00:00Z',
      '2026-11-13T23:00:00Z',
      1500,
      2500,
      0,
      1,
      'PUBLISHED',
      'user_organizer'
    ],
    [
      'ev_past_chaporadance',
      'Chapora Dance Rituals 61.0',
      'Sunset to Moonrise Sessions',
      'chapora-dance-rituals-610',
      'Concluded 61st ritual session on the Chapora waterfront with heavy sub-woofers and continuous grooves.',
      'Community',
      'Goa',
      'House Of Chapora, Goa',
      'Chapora Jetty, Goa 403509',
      15.6042,
      73.7388,
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1794233791346-Chapora_dance_Ritual_61.0_-_axess_Banner.jpg-banner-1794233790749.webp',
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1794233789831-Chapora_dance_Ritual_61.0_-_axess_post.jpg-poster-1794233788773.webp',
      'Nov 11, 2026 | House Of Chapora, Goa',
      '2026-11-11T14:30:00Z',
      '2026-11-12T02:00:00Z',
      1000,
      2000,
      0,
      1,
      'PUBLISHED',
      'user_organizer'
    ],
    [
      'ev_past_tuestech',
      'Tues Tech 56.0',
      'Underground Tuesday Frequencies',
      'tues-tech-560',
      'Concluded 56th edition of the legendary midweek techno gathering at House of Chapora.',
      'Nightlife',
      'Goa',
      'House Of Chapora, Goa',
      'Chapora Jetty, Goa 403509',
      15.6042,
      73.7388,
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1794231872474-tuestech_56_axess_banner-banner-1794231872020.webp',
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1794231869968-tuestech_56_axess_post-poster-1794231869457.webp',
      'Nov 10, 2026 | House Of Chapora, Goa',
      '2026-11-10T14:30:00Z',
      '2026-11-11T02:00:00Z',
      800,
      1500,
      0,
      1,
      'PUBLISHED',
      'user_organizer'
    ],
    [
      'ev_past_sortedsounds',
      'Sorted Sounds: Diwali Edition ft. Cosmonaut',
      'Diwali Coastal Celebration',
      'sorted-sounds-diwali-edition-ft-cosmonaut',
      'Concluded deep atmospheric electronic voyage at Dynamo with Cosmonaut.',
      'Music',
      'Goa',
      'Dynamo, Goa',
      'Vagator Beach Road, Goa 403509',
      15.5990,
      73.7420,
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1793642385533-ss_nov_axess_banner-banner-1793642385168.webp',
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1793642382367-ss_nov_axess_post-poster-1793642381199.webp',
      'Nov 08, 2026 | Dynamo, Goa',
      '2026-11-08T14:30:00Z',
      '2026-11-09T02:00:00Z',
      1200,
      2200,
      0,
      1,
      'PUBLISHED',
      'user_organizer'
    ],
    [
      'ev_past_crystalclear',
      'Crystal Clear Sounds 14.0 - Diwali Edition',
      'Pure Acoustic Fidelity',
      'crystal-clear-sounds-140-diwali-edition',
      'Concluded high-definition sound celebration on Chapora jetty.',
      'Festival',
      'Goa',
      'House Of Chapora, Goa',
      'Chapora Jetty, Goa 403509',
      15.6042,
      73.7388,
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1793642563185-Crystal_clear_Sounds_14.0_-_axess_Banner.jpg-banner-1793642562686.webp',
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1793642559259-Crystal_clear_Sounds_14.0_-_Axess_Post.jpg-poster-1793642558454.webp',
      'Nov 07, 2026 | House Of Chapora, Goa',
      '2026-11-07T14:30:00Z',
      '2026-11-08T02:00:00Z',
      1000,
      2000,
      0,
      1,
      'PUBLISHED',
      'user_organizer'
    ],
    [
      'ev_past_amorgnosis',
      'AMORGNOSIS',
      'Psychedelic Communion',
      'amorgnosis',
      'Concluded immersive gathering at Dpedro clifftop.',
      'Nightlife',
      'Goa',
      'Dpedro, Goa',
      'D Pedro, Goa 403802',
      15.3950,
      73.8115,
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1793102362362-1000146361-banner-1793102362103.webp',
      'https://axess-prod.s3.ap-south-1.amazonaws.com/axess-images/5ee3431f-e708-43cf-b721-c1a859c21a64/events/1793337406029-1000147105-poster-1793337405357.webp',
      'Nov 07, 2026 | Dpedro, Goa',
      '2026-11-07T12:30:00Z',
      '2026-11-08T02:00:00Z',
      1500,
      2500,
      0,
      1,
      'PUBLISHED',
      'user_organizer'
    ]
  ];

  for (const ev of events) {
    insertEvent.run(...ev);
  }

  // 4. Seed Multi-Tier Ticket Matrix for active events
  const insertTier = db.prepare(`
    INSERT INTO ticket_tiers (
      id, event_id, name, description, price, capacity, sold_count,
      reserved_count, sale_state, perks, min_per_order, max_per_order, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tiers = [
    // UNMADA VARA NYE
    [
      'tier_unmada_eb',
      'ev_unmada_nye',
      'Early Bird GA (All 3 Days)',
      'Limited entry pass granting full access to Main Stage and Ambient Sanctuary.',
      2999,
      150,
      150,
      0,
      'Tier Closed',
      JSON.stringify(['3-Day Festival Access', 'Express Wristband Desk', 'Standard Bar Access']),
      1,
      4,
      1
    ],
    [
      'tier_unmada_p1',
      'ev_unmada_nye',
      'Phase 1 General Admission',
      'Standard 3-day wristband pass for all primary festival arenas.',
      3999,
      400,
      182,
      0,
      'Available Now',
      JSON.stringify(['3-Day Festival Access', 'Main & Forest Stage', 'Re-entry Allowed']),
      1,
      6,
      2
    ],
    [
      'tier_unmada_p2',
      'ev_unmada_nye',
      'Phase 2 GA Pass',
      'Next tier access released after Phase 1 allocation concludes.',
      5499,
      500,
      45,
      0,
      'Available Now',
      JSON.stringify(['3-Day Festival Access', 'Main & Forest Stage', 'Full Re-entry']),
      1,
      6,
      3
    ],
    [
      'tier_unmada_vip',
      'ev_unmada_nye',
      'VIP Backstage & Elevated Deck',
      'Exclusive high-rise stage deck with dedicated cocktail bar, luxury restrooms, and backstage artist patio.',
      9999,
      100,
      38,
      0,
      'Available Now',
      JSON.stringify(['Elevated Stage View', 'Private Restrooms', 'Dedicated Cashless Bar']),
      1,
      4,
      4
    ],
    [
      'tier_unmada_vvip',
      'ev_unmada_nye',
      'Royal VVIP Table Lounge (8 Guests)',
      'Private cabana lounge perched directly overlooking the amphitheatre stage.',
      24999,
      10,
      3,
      0,
      'Available Now',
      JSON.stringify(['8 VIP Wristbands', '2 Premium Spirit Bottles', 'Dedicated Server & Security']),
      1,
      1,
      5
    ],

    // Dark Obscura
    [
      'tier_do_regular',
      'ev_dark_obscura',
      'General Admission (Entry before Midnight)',
      'Standard door access before 00:00 IST.',
      1999,
      250,
      112,
      0,
      'Available Now',
      JSON.stringify(['Nocturnal Access', 'Strict No-Flash Compliance']),
      1,
      4,
      1
    ],
    [
      'tier_do_anytime',
      'ev_dark_obscura',
      'All-Night Open Pass',
      'Unrestricted entry and exit throughout the entire 11-hour ritual.',
      2499,
      200,
      64,
      0,
      'Available Now',
      JSON.stringify(['Anytime Entry', 'Re-entry Allowed', 'Sub-bass Deck']),
      1,
      4,
      2
    ],

    // Primal Void
    [
      'tier_pv_eb',
      'ev_primal_void',
      'Early Bird',
      'Concluded allocation for loyal community early patrons.',
      1499,
      100,
      100,
      0,
      'Tier Closed',
      JSON.stringify(['All-night Pass', 'No-phone Policy Area Access']),
      1,
      2,
      1
    ],
    [
      'tier_pv_p1',
      'ev_primal_void',
      'Phase 1',
      'Phase 1 pass for D Pedro clifftop sessions.',
      3499,
      200,
      200,
      0,
      'Tier Closed',
      JSON.stringify(['3-Day Entry', 'Clifftop Sunrise Access', 'Audio Sanctuary']),
      1,
      4,
      2
    ],
    [
      'tier_pv_t2',
      'ev_primal_void',
      'Tier 2',
      'Current active pass allocation for Primal Void.',
      4999,
      300,
      48,
      0,
      'Available Now',
      JSON.stringify(['3-Day Full Entry', 'Precision Engineered Sound System', 'Visionary Arts & Healing Zone']),
      1,
      6,
      3
    ],

    // Perseverance Festival
    [
      'tier_pers_eb',
      'ev_perseverance',
      'Early Bird (3 Days)',
      'Community pre-sale allocation.',
      2499,
      100,
      100,
      0,
      'Tier Closed',
      JSON.stringify(['3-Day Pass', 'Main Stage Access']),
      1,
      2,
      1
    ],
    [
      'tier_pers_p1',
      'ev_perseverance',
      'Phase 1 Full Pass',
      'Full weekend pass granting unrestricted entry to all 3 musical arenas.',
      3499,
      300,
      88,
      0,
      'Available Now',
      JSON.stringify(['3-Day Pass', 'Main & Forest Stages', 'Re-entry Allowed']),
      1,
      4,
      2
    ],
    [
      'tier_pers_vip',
      'ev_perseverance',
      'VIP Backstage Experience',
      'Backstage patio access with private cocktail bar and luxury lounges.',
      5999,
      60,
      19,
      0,
      'Available Now',
      JSON.stringify(['Backstage Access', 'Private Lounge', 'Priority Wristbands']),
      1,
      4,
      3
    ],

    // Vanaghotra The Decade Ritual
    [
      'tier_vana_eb',
      'ev_vanaghotra',
      'Early Bird 10-Year Celebration',
      'Decade anniversary celebratory pass tier.',
      1999,
      150,
      150,
      0,
      'Tier Closed',
      JSON.stringify(['Full Gathering Access', 'Anniversary Patch']),
      1,
      2,
      1
    ],
    [
      'tier_vana_p1',
      'ev_vanaghotra',
      'Phase 1 Ritual Pass',
      'Access across the entire 4-day ritual along the pristine riverbank.',
      2999,
      400,
      142,
      0,
      'Available Now',
      JSON.stringify(['4-Day Ritual Pass', 'Riverbank Deck', 'Camping Area Access']),
      1,
      4,
      2
    ],
    [
      'tier_vana_vip',
      'ev_vanaghotra',
      'VIP Sanctuary Cabana',
      'Exclusive high-deck viewing canopy with dedicated staff and hospitality.',
      4999,
      40,
      11,
      0,
      'Available Now',
      JSON.stringify(['VIP Deck Canopy', 'Express Gate', 'Complimentary Merch Pack']),
      1,
      2,
      3
    ],

    // ONCE IN A XMOON
    [
      'tier_xmoon_p1',
      'ev_xmoon',
      'Phase 1 Christmas Pass',
      'Entry for Christmas Eve clifftop celebration under the winter moon.',
      1499,
      250,
      96,
      0,
      'Available Now',
      JSON.stringify(['Christmas Edition Entry', 'Sunset to Sunrise Sets']),
      1,
      4,
      1
    ],
    [
      'tier_xmoon_p2',
      'ev_xmoon',
      'Phase 2 Christmas Pass',
      'Standard tier pass released for late-season visitors.',
      2199,
      300,
      40,
      0,
      'Available Now',
      JSON.stringify(['Full Night Access', 'Amphitheatre Stage']),
      1,
      4,
      2
    ],
    [
      'tier_xmoon_vip',
      'ev_xmoon',
      'VIP Clifftop Lounge',
      'Direct ocean-view elevated deck with dedicated bar service.',
      2999,
      50,
      18,
      0,
      'Available Now',
      JSON.stringify(['Ocean View Lounge', 'Private Bar', 'Fast-track Entry']),
      1,
      2,
      3
    ],

    // Hentai Cameraman Goa
    [
      'tier_hgoa_p1',
      'ev_hentai_goa',
      'Phase 1 Entry Pass',
      'Entry pass for the visual spectacle at House Of Chapora.',
      1200,
      200,
      72,
      0,
      'Available Now',
      JSON.stringify(['Night Showcase Access', 'Waterfront Deck']),
      1,
      4,
      1
    ],
    [
      'tier_hgoa_p2',
      'ev_hentai_goa',
      'Phase 2 Door Allocation',
      'Secondary release pass.',
      2000,
      150,
      25,
      0,
      'Available Now',
      JSON.stringify(['Waterfront Deck', 'Priority Entry']),
      1,
      4,
      2
    ],

    // Hentaicameraman - Bengaluru (GYLT)
    [
      'tier_hblr_p1',
      'ev_hentai_blr',
      'Phase 1 General Admission',
      'Full club access at GYLT Bangalore for the audiovisual presentation.',
      999,
      300,
      115,
      0,
      'Available Now',
      JSON.stringify(['General Admission', 'Heavy Sub-Bass Floor', 'AV Showcase']),
      1,
      6,
      1
    ],
    [
      'tier_hblr_p2',
      'ev_hentai_blr',
      'Phase 2 GA Pass',
      'Next allocation tier.',
      1800,
      250,
      42,
      0,
      'Available Now',
      JSON.stringify(['Express Entry', 'Mezzanine Viewing', 'AV Showcase']),
      1,
      6,
      2
    ],

    // INVENTION INTENTION
    [
      'tier_inv_eb',
      'ev_invention',
      'Early Bird Alchemical Pass',
      'Early access pre-sale for both nights.',
      2499,
      120,
      120,
      0,
      'Tier Closed',
      JSON.stringify(['2-Night Pass', 'Clifftop Stage']),
      1,
      2,
      1
    ],
    [
      'tier_inv_p1',
      'ev_invention',
      'Phase 1 Full Pass',
      'Standard pass for all sessions of sonic architecture at D Pedro.',
      3799,
      250,
      67,
      0,
      'Available Now',
      JSON.stringify(['2-Night Full Entry', 'Ambient Sanctuary', 'Visual Projections']),
      1,
      4,
      2
    ],
    [
      'tier_inv_vip',
      'ev_invention',
      'VIP Sonic Deck',
      'Elevated sound deck with acoustic clarity and private bar.',
      5999,
      35,
      12,
      0,
      'Available Now',
      JSON.stringify(['Acoustic Sweet Spot', 'Private Bar', 'Artist Patio']),
      1,
      2,
      3
    ],

    // Maleficus Noctis
    [
      'tier_male_p1',
      'ev_maleficus',
      'General Admission (Before Midnight)',
      'Door entry before 00:00 IST at Dpedro.',
      1200,
      200,
      83,
      0,
      'Available Now',
      JSON.stringify(['Nocturnal Access', 'Strict No-Flash Compliance']),
      1,
      4,
      1
    ],
    [
      'tier_male_p2',
      'ev_maleficus',
      'All-Night Open Pass',
      'Unrestricted entry throughout the entire darkpsy gathering.',
      2200,
      180,
      45,
      0,
      'Available Now',
      JSON.stringify(['Anytime Entry', 'Re-entry Allowed']),
      1,
      4,
      2
    ],

    // Ritual Of The Void Goa
    [
      'tier_rv_p1',
      'ev_ritual_void',
      'Phase 1 Void Pass',
      'Pass for Ritual Of The Void at Dream Beach.',
      1500,
      250,
      89,
      0,
      'Available Now',
      JSON.stringify(['Dream Beach Entry', 'Void Acoustics Rig']),
      1,
      4,
      1
    ],
    [
      'tier_rv_vip',
      'ev_ritual_void',
      'VIP Elevated Deck',
      'Exclusive VIP deck overlooking Vagator cove.',
      2500,
      50,
      14,
      0,
      'Available Now',
      JSON.stringify(['Elevated View', 'VIP Deck Bar', 'Express Gate']),
      1,
      2,
      2
    ]
  ];

  for (const t of tiers) {
    insertTier.run(...t);
  }

  // Pre-seed a test ticket order
  const orderId = 'ord_axess_sample_101';
  db.prepare(`
    INSERT INTO orders (
      id, order_number, user_id, event_id, total_amount, discount_amount,
      final_amount, status, payment_provider, payment_id, billing_name,
      billing_email, billing_phone
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderId,
    'AXS-2026-9941',
    'user_attendee',
    'ev_unmada_nye',
    3999,
    0,
    3999,
    'COMPLETED',
    'RAZORPAY',
    'pay_RzpMockTest99482',
    'Arjun Patel',
    'attendee@axess.zone',
    '+91 98765 43210'
  );

  const ticketCode = 'AXS-UNM-882190';
  const qrPayload = JSON.stringify({
    ticket_code: ticketCode,
    event_id: 'ev_unmada_nye',
    event_title: 'UNMADA VARA NYE',
    tier_name: 'Phase 1 General Admission',
    attendee_name: 'Arjun Patel',
    issued_at: new Date().toISOString(),
    sig: 'c8f7e2a9b3d14908a7e584f23e61c7d23f79021a8d052d9a'
  });

  db.prepare(`
    INSERT INTO tickets (
      id, ticket_code, order_id, event_id, tier_id, user_id,
      attendee_name, attendee_email, attendee_phone, security_signature,
      status, qr_payload
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'tkt_unmada_101',
    ticketCode,
    orderId,
    'ev_unmada_nye',
    'tier_unmada_p1',
    'user_attendee',
    'Arjun Patel',
    'attendee@axess.zone',
    '+91 98765 43210',
    'c8f7e2a9b3d14908a7e584f23e61c7d23f79021a8d052d9a',
    'VALID',
    qrPayload
  );

  console.log('[Database] Axess live S3 images and real events seeded successfully.');
}
