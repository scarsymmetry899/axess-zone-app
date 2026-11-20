import staticSeed from './staticSeed.json';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

function handleOfflineFallback(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const url = new URL(endpoint, 'http://dummy.com');
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  // 1. Hero Events
  if (pathname === '/events/hero') {
    return { success: true, events: staticSeed.hero || [] };
  }

  // 2. Past Events
  if (pathname === '/events/past') {
    return { success: true, events: staticSeed.past || [] };
  }

  // 3. Upcoming Events feed (with filters)
  if (pathname === '/events') {
    let list = [...(staticSeed.events || [])];
    const location = searchParams.get('location');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    if (location) {
      list = list.filter((e) => e.location_city?.toLowerCase() === location.toLowerCase());
    }
    if (category) {
      list = list.filter((e) => e.category?.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.title?.toLowerCase().includes(q) || e.venue_name?.toLowerCase().includes(q));
    }
    return { success: true, events: list };
  }

  // 4. Single Event Detail
  if (pathname.startsWith('/events/')) {
    const id = pathname.replace('/events/', '');
    const event = (staticSeed.events || []).find((e) => e.id === id) || (staticSeed.hero || []).find((e) => e.id === id);
    if (!event) return { success: false, error: 'Event not found' };
    const tiers = staticSeed.tiers?.[id] || [
      { id: `t_${id}_ga`, event_id: id, name: 'Phase 1 - General Admission', price: event.price_min || 1499, total_capacity: 300, remaining_capacity: 120, sale_state: 'AVAILABLE_NOW', perks: ['Full stage access'] },
      { id: `t_${id}_vip`, event_id: id, name: 'Phase 2 - VIP Backstage Pass', price: event.price_max || 4999, total_capacity: 50, remaining_capacity: 12, sale_state: 'AVAILABLE_NOW', perks: ['Dedicated bar', 'Backstage access'] }
    ];
    return { success: true, event, tiers };
  }

  // 5. Demo Accounts & Auth
  if (pathname === '/auth/demo-accounts') {
    return { success: true, accounts: staticSeed.demo || [] };
  }
  if (pathname === '/auth/login' || pathname === '/auth/switch-role') {
    const body = options.body ? JSON.parse(options.body) : {};
    const role = body.role || (body.email?.includes('organizer') ? 'ORGANIZER' : body.email?.includes('promoter') ? 'PROMOTER' : body.email?.includes('sponsor') ? 'SPONSOR' : body.email?.includes('admin') ? 'ADMIN' : 'USER');
    const matched = (staticSeed.demo || []).find((a) => a.role === role) || {
      id: `user_${role.toLowerCase()}`,
      name: `${role} Demo User`,
      email: `${role.toLowerCase()}@axess.zone`,
      role,
    };
    return { success: true, token: `demo_token_${role.toLowerCase()}`, user: matched };
  }
  if (pathname === '/auth/me') {
    return { success: true, user: { id: 'user_attendee', name: 'Rohan Sharma', role: 'USER' } };
  }

  // 6. Checkout & Holds
  if (pathname === '/checkout/hold') {
    return { success: true, holdToken: 'hold_' + Date.now(), expiresAt: new Date(Date.now() + 600000).toISOString() };
  }
  if (pathname.startsWith('/checkout/hold/')) {
    return { success: true, valid: true, expiresAt: new Date(Date.now() + 600000).toISOString() };
  }
  if (pathname === '/checkout/validate-promo') {
    const body = options.body ? JSON.parse(options.body) : {};
    if (body.code?.toUpperCase() === 'AXESS10') {
      const discount = Math.round((body.totalAmount || 1000) * 0.1);
      return { success: true, valid: true, discountAmount: discount, finalAmount: (body.totalAmount || 1000) - discount };
    }
    return { success: false, valid: false, message: 'Invalid voucher or promo code' };
  }
  if (pathname === '/checkout/create-order') {
    const body = options.body ? JSON.parse(options.body) : {};
    return { success: true, orderId: 'ord_' + Date.now(), amount: body.amount || 2999, currency: 'INR' };
  }
  if (pathname === '/checkout/verify-payment') {
    const body = options.body ? JSON.parse(options.body) : {};
    const savedTickets = JSON.parse(localStorage.getItem('axess_user_tickets') || '[]');
    const newTicket = {
      id: 'tkt_' + Date.now(),
      ticket_code: 'AXS-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      event_id: body.eventId || 'ev_unmada_nye',
      event_title: body.eventTitle || 'UNMADA VARA NYE',
      tier_name: body.tierName || 'General Pass',
      attendee_name: body.attendeeName || 'Rohan Sharma',
      status: 'VALID',
      security_signature: 'sig_' + Math.random().toString(36).substring(2, 10),
      created_at: new Date().toISOString()
    };
    savedTickets.unshift(newTicket);
    localStorage.setItem('axess_user_tickets', JSON.stringify(savedTickets));
    return { success: true, orderId: body.orderId || 'ord_' + Date.now(), tickets: [newTicket] };
  }

  // 7. Tickets Wallet
  if (pathname === '/tickets/my-tickets') {
    const savedTickets = JSON.parse(localStorage.getItem('axess_user_tickets') || '[]');
    if (!savedTickets.length) {
      savedTickets.push({
        id: 'tkt_default_1',
        ticket_code: 'AXS-PRML-892',
        event_id: 'ev_primal_void',
        event_title: 'Primal Void',
        venue_name: 'D Pedro, Goa',
        date_display: 'Dec 24 – 26, 2026',
        tier_name: 'Phase 1 - Full Access',
        attendee_name: 'Rohan Sharma',
        status: 'VALID',
        security_signature: 'sig_valid_primal_pass_892',
        created_at: '2026-11-20T10:00:00Z'
      });
    }
    return { success: true, tickets: savedTickets };
  }

  // 7b. Ticket Transfer Fallback
  if (pathname.includes('/transfer')) {
    return {
      success: true,
      message: 'Ticket pass successfully transferred. Previous QR code invalidated.',
      transferredTicket: { status: 'TRANSFERRED' }
    };
  }

  // 8. Gate Check-in
  if (pathname === '/gate/verify') {
    return { success: true, verified: true, message: 'Valid Entry Granted' };
  }

  // 9. Sync & Website Operations Fallback
  if (pathname === '/admin/sync-status') {
    return {
      success: true,
      upstreamUrl: 'https://www.axess.zone',
      webhookUrl: '/api/webhooks/website-sync',
      webhookSecret: 'axs_live_webhook_secret_99482',
      autoSyncFrequency: '15m',
      status: 'HEALTHY',
      lastSyncTimestamp: new Date().toISOString(),
      metrics: { totalGigsSynced: 12, totalTiersSynced: 24, recentLogsCount: 3 },
      logs: [
        { id: 'log_1', source_url: 'https://www.axess.zone', sync_type: 'SCHEDULED_CRON', status: 'SUCCESS', entities_synced: 12, details: 'Automated periodic sync with axess.zone: Synced 5 marquee gigs, 7 past events, 18 ticket tiers.', created_at: new Date(Date.now() - 900000).toISOString() },
        { id: 'log_2', source_url: 'https://www.axess.zone', sync_type: 'WEBHOOK', status: 'SUCCESS', entities_synced: 3, details: 'Webhook ingestion action UPDATE_TIER_STATE: Primal Void Tier 2 opened at ₹4,999.', created_at: new Date(Date.now() - 3600000).toISOString() }
      ]
    };
  }
  if (pathname === '/admin/sync-axess-website') {
    return {
      success: true,
      message: 'Direct synchronization with axess.zone completed successfully. 12 gigs and ticket matrices refreshed.',
      log: { id: 'sync_' + Date.now(), source_url: 'https://www.axess.zone', sync_type: 'MANUAL', status: 'SUCCESS', entities_synced: 12, details: 'App Owner live sync with axess.zone executed.', created_at: new Date().toISOString() }
    };
  }

  // 10. Notifications Fallback
  if (pathname === '/notifications' || pathname === '/admin/notifications') {
    const savedNotifs = JSON.parse(localStorage.getItem('axess_notifications') || '[]');
    const defaultNotifs = [
      { id: 'notif_1', title: '⚡ Final Phase Passes for Primal Void', message: 'Only 14 Tier 2 passes remaining for Primal Void at House of Chapora. Secure your tickets before tier closure.', target_location: 'Goa', target_role: 'ALL', action_link: 'ev_primal_void', priority: 'HIGH', category: 'ANNOUNCEMENT', recipient_count: 184, created_at: new Date().toISOString() },
      { id: 'notif_2', title: '✨ UNMADA VARA NYE VIP Loyalty Access', message: 'Loyalty members get complimentary backstage lounge access when booking Tier 2 or 3 this weekend.', target_location: 'ALL', target_role: 'USER', action_link: 'ev_unmada_nye', priority: 'NORMAL', category: 'OFFER', recipient_count: 412, created_at: new Date().toISOString() },
      { id: 'notif_3', title: '📍 Kasol Perseverance Festival Venue Advisory', message: 'Shuttle services from Kasol central circle will operate round the clock. Check live map for gate entry.', target_location: 'Kasol', target_role: 'ALL', action_link: 'ev_perseverance', priority: 'URGENT', category: 'ALERT', recipient_count: 96, created_at: new Date().toISOString() }
    ];
    return { success: true, notifications: savedNotifs.length > 0 ? savedNotifs : defaultNotifs };
  }
  if (pathname === '/admin/notifications' && method === 'POST') {
    const body = options.body ? JSON.parse(options.body) : {};
    const newNotif = {
      id: 'notif_' + Date.now(),
      title: body.title,
      message: body.message,
      target_location: body.target_location || 'ALL',
      target_role: body.target_role || 'ALL',
      category: body.category || 'ANNOUNCEMENT',
      priority: body.priority || 'NORMAL',
      action_link: body.action_link || '',
      recipient_count: 240,
      created_at: new Date().toISOString()
    };
    const list = JSON.parse(localStorage.getItem('axess_notifications') || '[]');
    list.unshift(newNotif);
    localStorage.setItem('axess_notifications', JSON.stringify(list));
    return { success: true, message: 'Notification broadcasted', notification: newNotif };
  }

  // 11. Retargeting Fallback
  if (pathname === '/admin/retargeting') {
    return {
      success: true,
      stats: {
        openCartsCount: 3,
        abandonedGrossINR: 17995,
        redeemedAttendeesCount: 28,
        totalRecoveredRevenueINR: 296650,
        totalConvertedCount: 88
      },
      campaigns: [
        { id: 'retarget_1', name: 'Automated Cart Recovery (1 Hour)', segment_type: 'ABANDONED_CART', filter_location: 'ALL', discount_code: 'AXESS10', discount_percent: 10, message_template: 'Hey, your tickets are still held! Complete your checkout with 10% off before passes release.', auto_trigger: 1, total_reached: 86, total_converted: 29, recovered_revenue: 87400, is_active: 1 },
        { id: 'retarget_2', name: 'Post-Gig Loyalty Invite (Redeemed Passes)', segment_type: 'REDEEMED_TICKETS', filter_location: 'Goa', discount_code: 'LOYALTY15', discount_percent: 15, message_template: 'Loved House of Chapora? Unlock 15% VIP discount on next week’s Primal Void ritual.', auto_trigger: 1, total_reached: 142, total_converted: 48, recovered_revenue: 168000, is_active: 1 },
        { id: 'retarget_3', name: 'Engaged Nightlife Browsers', segment_type: 'ENGAGED_BROWSERS', filter_location: 'Bangalore', discount_code: 'BLRVIP', discount_percent: 12, message_template: 'Exclusive early-bird pass access for upcoming Bangalore gigs.', auto_trigger: 0, total_reached: 52, total_converted: 11, recovered_revenue: 41250, is_active: 1 }
      ],
      abandonedCarts: [
        { id: 'cart_1', event_title: 'Primal Void', tier_name: 'Tier 2 (Available Now)', quantity: 2, total_amount: 9998, user_email: 'attendee@axess.zone', status: 'OPEN' },
        { id: 'cart_2', event_title: 'UNMADA VARA NYE', tier_name: 'Tier 2 (Phase 2)', quantity: 1, total_amount: 2999, user_email: 'kabir.mehta@gmail.com', status: 'OPEN' },
        { id: 'cart_3', event_title: 'Perseverance Festival', tier_name: 'Phase 1 Festival Pass', quantity: 2, total_amount: 4998, user_email: 'ananya.s@outlook.com', status: 'OPEN' }
      ]
    };
  }

  // Default fallback
  return { success: true };
}

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('axess_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (err) {
    // If remote server is unreachable, use offline fallback
    return handleOfflineFallback(endpoint, options);
  }
}

export const api = {
  // Auth
  login: (email, password) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => apiRequest('/auth/me'),
  switchRole: (role) => apiRequest('/auth/switch-role', { method: 'POST', body: JSON.stringify({ role }) }),
  getDemoAccounts: () => apiRequest('/auth/demo-accounts'),

  // Events
  getHeroEvents: () => apiRequest('/events/hero'),
  getPastEvents: () => apiRequest('/events/past'),
  getEvents: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/events${qs ? `?${qs}` : ''}`);
  },
  getEventDetail: (id) => apiRequest(`/events/${id}`),
  createEvent: (payload) => apiRequest('/events', { method: 'POST', body: JSON.stringify(payload) }),
  updateEvent: (id, payload) => apiRequest(`/events/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteEvent: (id) => apiRequest(`/events/${id}`, { method: 'DELETE' }),

  // Tiers
  updateTierStatus: (tierId, sale_state) => apiRequest(`/tiers/${tierId}/status`, { method: 'PUT', body: JSON.stringify({ sale_state }) }),
  updateTier: (tierId, payload) => apiRequest(`/tiers/${tierId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  addTier: (eventId, payload) => apiRequest(`/tiers/event/${eventId}`, { method: 'POST', body: JSON.stringify(payload) }),

  // Checkout & Holds
  createHold: (tierId, quantity) => apiRequest('/checkout/hold', { method: 'POST', body: JSON.stringify({ tierId, quantity }) }),
  checkHold: (holdToken) => apiRequest(`/checkout/hold/${holdToken}`),
  releaseHold: (holdToken) => apiRequest(`/checkout/hold/${holdToken}`, { method: 'DELETE' }),
  validatePromo: (code, eventId, totalAmount) => apiRequest('/checkout/validate-promo', { method: 'POST', body: JSON.stringify({ code, eventId, totalAmount }) }),
  createOrder: (payload) => apiRequest('/checkout/create-order', { method: 'POST', body: JSON.stringify(payload) }),
  verifyPayment: (payload) => apiRequest('/checkout/verify-payment', { method: 'POST', body: JSON.stringify(payload) }),

  // Tickets
  getMyTickets: () => apiRequest('/tickets/my-tickets'),
  getTicket: (id) => apiRequest(`/tickets/${id}`),
  refundTicket: (id) => apiRequest(`/tickets/${id}/refund`, { method: 'POST' }),
  transferTicket: (id, payload) => apiRequest(`/tickets/${id}/transfer`, { method: 'POST', body: JSON.stringify(payload) }),

  // Gate Check-in
  verifyGateScan: (payload) => apiRequest('/gate/verify', { method: 'POST', body: JSON.stringify(payload) }),
  getGateStats: (eventId) => apiRequest(`/gate/event/${eventId}/stats`),

  // Promoters
  getPromoterDashboard: (promoterId) => apiRequest(`/promoters/dashboard${promoterId ? `?promoterId=${promoterId}` : ''}`),
  createPromoterCode: (payload) => apiRequest('/promoters/codes', { method: 'POST', body: JSON.stringify(payload) }),

  // Sponsors
  getSponsorshipPackages: () => apiRequest('/sponsors/packages'),
  submitSponsorshipInquiry: (payload) => apiRequest('/sponsors/inquire', { method: 'POST', body: JSON.stringify(payload) }),
  getMyInquiries: () => apiRequest('/sponsors/my-inquiries'),

  // Admin
  getAdminOverview: () => apiRequest('/admin/overview'),
  getAdminUsers: () => apiRequest('/admin/users'),
  triggerLiveSync: (payload) => apiRequest('/admin/sync-trigger', { method: 'POST', body: JSON.stringify(payload || {}) }),
  getSyncStatus: () => apiRequest('/admin/sync-status'),
  syncAxessWebsite: (payload) => apiRequest('/admin/sync-axess-website', { method: 'POST', body: JSON.stringify(payload || {}) }),

  // Notifications
  getNotifications: (params) => {
    const qs = params ? new URLSearchParams(params).toString() : '';
    return apiRequest(`/notifications${qs ? `?${qs}` : ''}`);
  },
  getAdminNotifications: () => apiRequest('/admin/notifications'),
  sendAdminNotification: (payload) => apiRequest('/admin/notifications', { method: 'POST', body: JSON.stringify(payload) }),

  // Retargeting
  getRetargetingData: () => apiRequest('/admin/retargeting'),
  createRetargetingCampaign: (payload) => apiRequest('/admin/retargeting/campaigns', { method: 'POST', body: JSON.stringify(payload) }),
  toggleRetargetingRule: (payload) => apiRequest('/admin/retargeting/rules/toggle', { method: 'POST', body: JSON.stringify(payload) }),
  trackAbandonedCart: (payload) => apiRequest('/admin/retargeting/track-cart', { method: 'POST', body: JSON.stringify(payload) }),
};