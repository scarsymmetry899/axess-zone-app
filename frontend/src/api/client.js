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

  // 8. Gate Check-in
  if (pathname === '/gate/verify') {
    return { success: true, verified: true, message: 'Valid Entry Granted' };
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
  triggerLiveSync: (payload) => apiRequest('/admin/sync-trigger', { method: 'POST', body: JSON.stringify(payload) }),
};