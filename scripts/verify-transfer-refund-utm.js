const { chromium } = require('playwright');
const path = require('path');

async function testTransferAndRefund() {
  console.log('===============================================================');
  console.log('  AXESS: TICKET TRANSFER, REFUND POLICY & UTM PLAYWRIGHT AUDIT');
  console.log('===============================================================');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();
  const artifactsDir = 'C:\\Users\\abhit\\.gemini\\antigravity\\brain\\98c0b46a-3a3c-4570-a590-04a0c34db136';

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Visit App with UTM attribution params
    console.log('\n--- TEST 1: UTM Attribution Parsing on App Load ---');
    await page.goto('http://localhost:5173/?utm_source=instagram&utm_medium=reels&utm_campaign=nye_2026', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    // Verify stored UTMs in sessionStorage
    const storedUtms = await page.evaluate(() => sessionStorage.getItem('axess_utm_params'));
    assert(storedUtms && storedUtms.includes('instagram'), 'UTM attribution parameters captured in session: ' + storedUtms);

    // 2. Open Event Details & Verify Refund Notice
    console.log('\n--- TEST 2: Event Details Refund Window & Terms Notice ---');
    const bookBtnOnCard = page.locator('.card-glossy:has-text("Primal Void") button:has-text("Book tickets")').first();
    await bookBtnOnCard.scrollIntoViewIfNeeded();
    await bookBtnOnCard.click();
    await page.waitForTimeout(1000);

    const refundNotice = page.locator('text="Strict No-Refund Policy"');
    assert(await refundNotice.isVisible(), 'Explicit "Strict No-Refund Policy" / window notice visible in Event Details');

    // 3. Open Checkout & Verify Refund Policy Banner
    console.log('\n--- TEST 3: Checkout Modal Refund Terms ---');
    const bookTicketsInModal = page.locator('div[class*="fixed"] button:has-text("Book Tickets")').first();
    await bookTicketsInModal.click();
    await page.waitForTimeout(1000);

    const checkoutRefundNotice = page.locator('text=Strictly Non-Refundable');
    assert(await checkoutRefundNotice.isVisible(), 'Checkout modal states non-refundable policy before payment');

    await page.screenshot({ path: path.join(artifactsDir, 'refund-notice-verified.png') });
    console.log('[Artifact] Saved refund-notice-verified.png');

    // Close checkout
    const closeCheckout = page.locator('div[class*="fixed"] button[aria-label="Close"]').first();
    await closeCheckout.click();
    await page.waitForTimeout(500);

    // Dismiss floating nudge
    const dismissNudge = page.locator('button[aria-label="Dismiss banner"]');
    if (await dismissNudge.isVisible()) await dismissNudge.click();

    // 4. Test Peer-to-Peer Ticket Transfer (District / DICE style)
    console.log('\n--- TEST 4: Peer-to-Peer Ticket Transfer (District Style) ---');
    // Login as Attendee first to establish authenticated custody
    const loginNavBtn = page.locator('button[aria-label="Login"]').first();
    await loginNavBtn.click();
    await page.waitForTimeout(600);
    const userRoleCard = page.locator('button:has-text("User"), button:has-text("Attendee")').first();
    await userRoleCard.click();
    await page.waitForTimeout(1000);

    // Open Tickets Wallet
    const ticketsNavBtn = page.locator('button[aria-label="Your tickets"]').first();
    await ticketsNavBtn.click();
    await page.waitForTimeout(1200);

    const transferBtn = page.locator('button:has-text("Transfer")').first();
    assert(await transferBtn.isVisible(), 'Transfer Ticket button visible on active digital pass');
    await transferBtn.click();
    await page.waitForTimeout(600);

    const transferModal = page.locator('text=District / DICE Anti-Duplication Safeguard');
    assert(await transferModal.isVisible(), 'Anti-fraud custody handover dialog displayed with safety warning');

    // Fill recipient
    await page.fill('input[placeholder="friend@axess.zone"]', 'priya.sharma@gmail.com');
    await page.fill('input[placeholder="e.g. Maya Sen"]', 'Priya Sharma');

    await page.screenshot({ path: path.join(artifactsDir, 'ticket-transfer-modal-verified.png') });
    console.log('[Artifact] Saved ticket-transfer-modal-verified.png');

    // Submit transfer
    const confirmTransferBtn = page.locator('button:has-text("Confirm Transfer")');
    await confirmTransferBtn.click();
    await page.waitForTimeout(1500);

    const transferredSuccess = page.locator('text=Custody Handed Over');
    assert(await transferredSuccess.isVisible(), 'Ticket pass custody atomically transferred to recipient');

    console.log('\n===============================================================');
    console.log(`  AUDIT COMPLETED: ${passed} PASSED | ${failed} FAILED`);
    console.log('===============================================================');

  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    await browser.close();
  }
}

testTransferAndRefund();
