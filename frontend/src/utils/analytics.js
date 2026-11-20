/**
 * Axess Analytics & UTM Attribution Engine
 * Tracks user journey, GA4 events, Meta Pixel, and persists marketing attribution (UTM parameters)
 * Official Axess GA4 Measurement ID: G-FLHPR19T5T
 */

export const GA_MEASUREMENT_ID = 'G-FLHPR19T5T';

// Parse and store UTM params from window location
export function initUtmTracking() {
  if (typeof window === 'undefined') return;

  try {
    const params = new URLSearchParams(window.location.search);
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref'];
    const currentUtms = {};
    let hasUtm = false;

    utmKeys.forEach((key) => {
      const val = params.get(key);
      if (val) {
        currentUtms[key] = val;
        hasUtm = true;
      }
    });

    if (hasUtm) {
      sessionStorage.setItem('axess_utm_params', JSON.stringify(currentUtms));
      console.log('[Analytics] Captured UTM attribution parameters:', currentUtms);
    }
  } catch (err) {
    console.warn('[Analytics] Failed to parse UTM parameters:', err);
  }
}

// Retrieve stored UTM parameters to attach to checkout orders
export function getStoredUtmParams() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem('axess_utm_params');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Track event in Google Analytics (GA4)
export function trackEvent(eventName, params = {}) {
  const utms = getStoredUtmParams();
  const payload = {
    ...utms,
    ...params,
    timestamp: new Date().toISOString()
  };

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, payload);
    console.log(`[GA4 Track: ${eventName}]`, payload);
  } else {
    console.log(`[Analytics: ${eventName}] (Simulated GA4 ${GA_MEASUREMENT_ID})`, payload);
  }
}

// E-commerce funnel helper tracking
export const analytics = {
  viewItem: (event) => {
    trackEvent('view_item', {
      item_id: event.id,
      item_name: event.title,
      item_category: event.category,
      item_location: event.location_city,
      price: event.price_min
    });
  },

  addToCart: (event, tier, quantity) => {
    trackEvent('add_to_cart', {
      item_id: event.id,
      item_name: event.title,
      item_variant: tier.name,
      quantity,
      price: tier.price,
      currency: 'INR'
    });
  },

  beginCheckout: (event, tier, quantity, total) => {
    trackEvent('begin_checkout', {
      item_id: event.id,
      item_name: event.title,
      item_variant: tier.name,
      quantity,
      value: total,
      currency: 'INR'
    });
  },

  purchase: (orderId, total, items = []) => {
    trackEvent('purchase', {
      transaction_id: orderId,
      value: total,
      currency: 'INR',
      items
    });
  },

  ticketTransfer: (ticketCode, recipientEmail) => {
    trackEvent('ticket_transfer', {
      ticket_code: ticketCode,
      recipient_email_domain: recipientEmail.split('@')[1] || 'unknown'
    });
  }
};
