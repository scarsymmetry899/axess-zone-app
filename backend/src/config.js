import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'axess_super_secret_jwt_key_2026_monochrome',
  ticketSecret: process.env.TICKET_SECRET || 'axess_crypto_ticket_signing_secret_99482',
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || '',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_axessZone2026',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'axess_razorpay_secret_live_test',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  holdTtlSeconds: parseInt(process.env.HOLD_TTL_SECONDS || '600', 10), // 10 minutes hold
};
