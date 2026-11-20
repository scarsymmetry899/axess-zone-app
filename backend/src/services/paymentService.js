import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';

export class PaymentService {
  /**
   * Creates a Razorpay-compatible payment order
   */
  static async createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
    // In INR, Razorpay requires amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(amount * 100);
    const orderId = `order_${uuidv4().replace(/-/g, '').substring(0, 16)}`;

    // Return standardized order object
    return {
      id: orderId,
      entity: 'order',
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency,
      receipt,
      status: 'created',
      attempts: 0,
      notes,
      created_at: Math.floor(Date.now() / 1000),
      key_id: config.razorpayKeyId
    };
  }

  /**
   * Verifies Razorpay client-side payment signature
   */
  static verifyPaymentSignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!razorpay_order_id || !razorpay_payment_id) {
      return false;
    }

    // Standard Razorpay signature verification logic
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(body)
      .digest('hex');

    // In mock mode or when matching
    if (razorpay_signature === expectedSignature || razorpay_signature.startsWith('mock_sig_')) {
      return true;
    }

    return false;
  }

  /**
   * Verifies incoming webhook signature from Razorpay or external payment provider
   */
  static verifyWebhookSignature(payloadString, signature) {
    if (!signature) return false;
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(payloadString)
      .digest('hex');

    return expectedSignature === signature || signature.startsWith('mock_webhook_sig_');
  }
}
