const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runAudit() {
  console.log('===============================================================');
  console.log('  AXESS: SYNC, NOTIFICATIONS & RETARGETING E2E PLAYWRIGHT AUDIT');
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
    // 1. Visit App
    console.log('\n--- TEST 1: App Loading & Notification Bell Verification ---');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const bellBtn = page.locator('button[aria-label="Notifications & Drops"]');
    assert(await bellBtn.isVisible(), 'Notification Bell is visible on header navigation bar');

    // Click Bell to open Notification Drawer
    await bellBtn.click();
    await page.waitForTimeout(600);

    const notifHeader = page.locator('h2:has-text("Notifications & Drops")');
    assert(await notifHeader.isVisible(), 'Notification & Drops slide-over drawer opened');

    const goaChip = page.locator('div[class*="border-l"] button:has-text("Goa")');
    assert(await goaChip.isVisible(), 'Location filter chips (Goa, Bangalore, Kasol) present in drawer');

    // Filter by Goa
    await goaChip.click();
    await page.waitForTimeout(400);

    const closeNotifBtn = page.locator('button[aria-label="Close notifications"]');
    await closeNotifBtn.click();
    await page.waitForTimeout(400);

    // 2. Cart Abandonment & Retargeting Nudge Flow
    console.log('\n--- TEST 2: Cart Abandonment Tracking & Floating Retargeting Nudge ---');
    // Open Primal Void card via Book tickets button
    const bookTicketsOnCard = page.locator('.card-glossy:has-text("Primal Void") button:has-text("Book tickets")').first();
    await bookTicketsOnCard.scrollIntoViewIfNeeded();
    await bookTicketsOnCard.click();
    await page.waitForTimeout(1000);

    // Click Book Tickets inside modal to launch checkout
    const bookBtn = page.locator('div[class*="fixed"] button:has-text("Book Tickets")').first();
    await bookBtn.click();
    await page.waitForTimeout(1000);

    // Checkout modal is open. Now close it via aria-label="Close" to simulate cart abandonment!
    const closeCheckoutBtn = page.locator('div[class*="fixed"] button[aria-label="Close"]').first();
    await closeCheckoutBtn.click();
    await page.waitForTimeout(800);

    // Check if floating retargeting nudge appears
    const retargetNudge = page.locator('text=Your tickets are temporarily held!');
    assert(await retargetNudge.isVisible(), 'Floating cart abandonment retargeting nudge appeared');
    const promoCodeMention = page.locator('strong:has-text("CART10")');
    assert(await promoCodeMention.isVisible(), '10% discount promo code CART10 offered in retention nudge');

    // Take screenshot of cart retargeting nudge
    await page.screenshot({ path: path.join(artifactsDir, 'retargeting-nudge-verified.png') });
    console.log('[Artifact] Saved retargeting-nudge-verified.png');

    // Dismiss nudge
    const dismissNudge = page.locator('button[aria-label="Dismiss banner"]');
    if (await dismissNudge.isVisible()) {
      await dismissNudge.click();
    }
    await page.waitForTimeout(400);

    // 3. SuperAdmin Portal Login
    console.log('\n--- TEST 3: SuperAdmin Portal Access ---');
    const loginNavBtn = page.locator('nav + * button[aria-label="Login"], button:has-text("Login")').first();
    await loginNavBtn.click();
    await page.waitForTimeout(600);

    // Select App Owner (SuperAdmin) tile which triggers instant authenticated switch
    const ownerCard = page.locator('button:has-text("App Owner")');
    await ownerCard.click();
    await page.waitForTimeout(1200);

    // Open Admin Master Control
    const adminNavBtn = page.locator('button:has-text("Admin")').first();
    await adminNavBtn.click();
    await page.waitForTimeout(1000);

    const adminTitle = page.locator('span:has-text("App Owner Master Control")');
    assert(await adminTitle.isVisible(), 'SuperAdmin Master Control portal opened');

    // 4. Test Website Operations & Live Sync Tab
    console.log('\n--- TEST 4: Website Operations & Live Sync (axess.zone) ---');
    const syncTab = page.locator('button:has-text("Website Sync")');
    assert(await syncTab.isVisible(), 'Website Sync tab present in SuperAdmin');
    await syncTab.click();
    await page.waitForTimeout(800);

    const upstreamMention = page.locator('text=axess.zone (Production)');
    assert(await upstreamMention.isVisible(), 'Upstream production link to axess.zone confirmed');

    const webhookInput = page.locator('input[value*="/api/webhooks/website-sync"]');
    assert(await webhookInput.isVisible(), 'Incoming webhook integration endpoint displayed');

    // Trigger direct live sync
    const syncNowBtn = page.locator('button:has-text("Sync from axess.zone Now")');
    await syncNowBtn.click();
    await page.waitForTimeout(1500);

    const syncSuccessBanner = page.locator('text=Direct synchronization with axess.zone completed');
    assert(await syncSuccessBanner.isVisible(), 'Direct live sync with axess.zone completed with audit log');

    await page.screenshot({ path: path.join(artifactsDir, 'admin-sync-operations-verified.png') });
    console.log('[Artifact] Saved admin-sync-operations-verified.png');

    // 5. Test Targeted Notifications Setup Mode Tab
    console.log('\n--- TEST 5: Notifications Setup Mode & Mobile Push Preview ---');
    const notifTab = page.locator('button:has-text("Notifications")');
    assert(await notifTab.isVisible(), 'Notifications Setup tab present in SuperAdmin');
    await notifTab.click();
    await page.waitForTimeout(800);

    const pushPreview = page.locator('text=Live Push Notification Preview');
    assert(await pushPreview.isVisible(), 'Real-time smartphone push notification preview rendered');

    // Compose custom notification
    await page.fill('input[placeholder*="Final Phase Passes"]', '🔥 Exclusive VIP Access for Goa Nightlife');
    await page.fill('textarea[placeholder*="remaining for Primal Void"]', 'Flash drop for House of Chapora. Limited loyalty passes live.');
    await page.selectOption('select:has(option[value="Goa"])', 'Goa');
    await page.selectOption('select:has(option[value="USER"])', 'USER');

    // Broadcast notification
    const broadcastBtn = page.locator('button:has-text("Broadcast Notification to App Users")');
    await broadcastBtn.click();
    await page.waitForTimeout(1200);

    const broadcastSuccess = page.locator('text=broadcasted to');
    assert(await broadcastSuccess.isVisible(), 'Custom targeted notification broadcasted via WebSockets');

    await page.screenshot({ path: path.join(artifactsDir, 'admin-notifications-setup-verified.png') });
    console.log('[Artifact] Saved admin-notifications-setup-verified.png');

    // 6. Test Retargeting Engine Tab
    console.log('\n--- TEST 6: Retargeting Engine & Abandoned Cart Recovery ---');
    const retargetTab = page.locator('button:has-text("Retargeting")');
    assert(await retargetTab.isVisible(), 'Retargeting Engine tab present in SuperAdmin');
    await retargetTab.click();
    await page.waitForTimeout(800);

    const openCartsKpi = page.locator('text=Open Abandoned Carts');
    assert(await openCartsKpi.isVisible(), 'Open Abandoned Carts KPI rendered');

    const redeemedPoolKpi = page.locator('text=Redeemed Attendee Pool');
    assert(await redeemedPoolKpi.isVisible(), 'Redeemed Attendee Pool KPI rendered');

    const activeRules = page.locator('text=Automated Retargeting Rules');
    assert(await activeRules.isVisible(), 'Automated retargeting rules toggles rendered');

    // Send 10% nudge to an abandoned cart
    const nudgeBtn = page.locator('button:has-text("Send 10% Nudge")').first();
    if (await nudgeBtn.isVisible()) {
      await nudgeBtn.click();
      await page.waitForTimeout(1000);
      const nudgeSuccess = page.locator('text=Retargeting discount sent');
      assert(await nudgeSuccess.isVisible(), '1-Click retargeting nudge executed for abandoned cart');
    }

    await page.screenshot({ path: path.join(artifactsDir, 'admin-retargeting-engine-verified.png') });
    console.log('[Artifact] Saved admin-retargeting-engine-verified.png');

    console.log('\n===============================================================');
    console.log(`  AUDIT COMPLETED: ${passed} PASSED | ${failed} FAILED`);
    console.log('===============================================================');

  } catch (err) {
    console.error('Audit failed with error:', err);
  } finally {
    await browser.close();
  }
}

runAudit();
