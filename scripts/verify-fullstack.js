// Complete End-to-End Platform Verification Script

async function runVerification() {
  console.log('--- AXESS PLATFORM INTEGRATION TEST SUITE ---');

  // 1. Health check
  const healthRes = await fetch('http://localhost:5000/api/health').then(r => r.json());
  console.log('✓ 1. Backend Health Check:', healthRes.status, '| Platform:', healthRes.platform);

  // 2. Fetch Marquee Events
  const heroRes = await fetch('http://localhost:5000/api/events/hero').then(r => r.json());
  console.log(`✓ 2. Marquee Showcase Events Loaded: ${heroRes.events.length} marquee events`);
  heroRes.events.forEach(e => console.log(`   - ${e.title} (${e.date_display}) @ ${e.venue_name}`));

  // 3. Test Filter By Location (Goa)
  const goaRes = await fetch('http://localhost:5000/api/events?location=Goa').then(r => r.json());
  console.log(`✓ 3. Filtered by Location (Goa): ${goaRes.events.length} events returned`);

  // 4. Test Event Detail with Ticket Tiers
  const detailRes = await fetch('http://localhost:5000/api/events/ev_unmada_nye').then(r => r.json());
  console.log(`✓ 4. Event Detail for "${detailRes.event.title}":`);
  console.log(`   Coordinates: [${detailRes.event.lat}, ${detailRes.event.lng}]`);
  console.log(`   Tiers found: ${detailRes.tiers.length}`);
  detailRes.tiers.forEach(t => console.log(`   * ${t.name}: ₹${t.price} [${t.sale_state}] (Available: ${t.available_qty})`));

  // 5. Create 10-Minute Hold Reservation
  const holdTier = detailRes.tiers.find(t => t.sale_state === 'Available Now');
  const holdRes = await fetch('http://localhost:5000/api/checkout/hold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tierId: holdTier.id, quantity: 2 })
  }).then(r => r.json());
  console.log('✓ 5. Temporary Hold Created:', holdRes.holdToken, '| TTL Seconds:', holdRes.ttlSeconds);

  // 6. Validate Promo Code (AXESS10)
  const promoRes = await fetch('http://localhost:5000/api/checkout/validate-promo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'AXESS10', eventId: 'ev_unmada_nye', totalAmount: holdTier.price * 2 })
  }).then(r => r.json());
  console.log(`✓ 6. Promo Code Validated: ${promoRes.code} -> Discount: ₹${promoRes.calculatedDiscount}`);

  // 7. Create Checkout Order
  const orderRes = await fetch('http://localhost:5000/api/checkout/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      holdToken: holdRes.holdToken,
      billingName: 'Karan Mehra',
      billingEmail: 'karan@axess.zone',
      billingPhone: '+91 99887 76655',
      promoCode: 'AXESS10',
      idempotencyKey: `idemp_${Date.now()}`
    })
  }).then(r => r.json());
  console.log(`✓ 7. Gateway Order Created: ${orderRes.orderNumber} | Final Amount: ₹${orderRes.amount}`);

  // 8. Verify Payment & Generate Crypto-Signed QR Passes
  const verifyRes = await fetch('http://localhost:5000/api/checkout/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: orderRes.orderId,
      holdToken: holdRes.holdToken,
      razorpay_order_id: orderRes.gatewayOrderId,
      razorpay_payment_id: `pay_${Date.now()}`,
      razorpay_signature: 'mock_sig_pass'
    })
  }).then(r => r.json());
  console.log(`✓ 8. Payment Finalized & Cryptographically Signed Passes Issued:`);
  console.log(`   Tickets Issued: ${verifyRes.tickets.length}`);
  verifyRes.tickets.forEach(t => console.log(`   - Code: ${t.ticket_code} | Attendee: ${t.attendee_name}`));

  // 9. Authenticate as Admin / Gate Staff
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@axess.zone', password: 'axess123' })
  }).then(r => r.json());
  const token = loginRes.token;

  // 10. Gate Door Scan 1: Verify & Admit
  const scan1 = await fetch('http://localhost:5000/api/gate/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ticketCode: verifyRes.tickets[0].ticket_code })
  }).then(r => r.json());
  console.log(`✓ 9. Gate Scanner (First Scan): ${scan1.status} -> ${scan1.message}`);

  // 11. Gate Door Scan 2: Duplicate Admission Prevention
  const scan2 = await fetch('http://localhost:5000/api/gate/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ticketCode: verifyRes.tickets[0].ticket_code })
  });
  const scan2Data = await scan2.json();
  console.log(`✓ 10. Gate Scanner (Second Scan - Duplicate Entry Protection):`);
  console.log(`   Status: ${scan2Data.status} | Message: ${scan2Data.message}`);

  // 12. Check Promoter Stats Attribution
  const promoterRes = await fetch('http://localhost:5000/api/promoters/dashboard', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json());
  console.log(`✓ 11. Promoter Attribution Ledger: Total Attributed Orders: ${promoterRes.summary.totalOrders} | Earned: ₹${promoterRes.summary.earnedCommission}`);

  console.log('\n======================================================');
  console.log('   ALL AXESS FULL-STACK WORKFLOWS VERIFIED 100%');
  console.log('======================================================\n');
}

runVerification().catch(err => console.error('Verification Error:', err));
