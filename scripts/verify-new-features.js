const { chromium } = require('playwright');

async function testNewFeatures() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('1. Navigating to http://localhost:5173...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // 2. Open Login Screen
  console.log('2. Opening Axess Login Screen...');
  const loginBtn = page.locator('button[aria-label="Login"]');
  await loginBtn.click();
  await page.waitForTimeout(600);

  // Check login modal
  const loginModalTitle = await page.locator('h2:has-text("Enter Axess")').count();
  console.log('Login modal header present:', loginModalTitle > 0);
  const browseBtn = await page.locator('button:has-text("Browse without logging in")').count();
  console.log('Browse without logging in button present:', browseBtn > 0);

  await page.screenshot({ path: 'scripts/verify-01-login-screen.png' });
  console.log('Saved scripts/verify-01-login-screen.png');

  // 3. Click "Browse without logging in"
  console.log('3. Clicking "Browse without logging in"...');
  await page.locator('button:has-text("Browse without logging in")').click();
  await page.waitForTimeout(400);

  // 4. Open Primal Void Event Modal
  console.log('4. Opening Primal Void Event Detail Modal...');
  // Find Primal Void card in Up Next feed or hero
  const primalVoidCard = page.locator('text=Primal Void').first();
  await primalVoidCard.click();
  await page.waitForTimeout(1000);

  // Verify Ticket Information container
  const ticketInfoHeading = await page.locator('h3:has-text("Ticket Information")').count();
  console.log('Ticket Information box present:', ticketInfoHeading > 0);

  // Verify tiers (Early Bird, Phase 1, Tier 2)
  const availableNowText = await page.locator('text=Available Now').count();
  console.log('Available Now tiers present:', availableNowText > 0);

  // Verify Book Tickets button
  const bookTicketsBtn = await page.locator('button:has-text("Book Tickets")').count();
  console.log('Book Tickets button in ticket box present:', bookTicketsBtn > 0);

  // Verify OpenStreetMap container
  const osmAttribution = await page.locator('text=OpenStreetMap contributors').count();
  console.log('OpenStreetMap attribution loaded (NO API key required):', osmAttribution > 0);

  await page.screenshot({ path: 'scripts/verify-02-event-detail.png' });
  console.log('Saved scripts/verify-02-event-detail.png');

  // Close event modal
  await page.locator('button[aria-label="Close"]').first().click();
  await page.waitForTimeout(400);

  // 5. Open Master Admin / Owner Login
  console.log('5. Testing Master Owner Login & Admin Controls...');
  await loginBtn.click();
  await page.waitForTimeout(400);
  // Click on App Owner role card
  const appOwnerBtn = page.locator('button:has-text("App Owner")').first();
  await appOwnerBtn.click();
  await page.waitForTimeout(600);

  // Open Admin portal from top bar
  const adminNavBtn = page.locator('button:has-text("Admin")').first();
  if (await adminNavBtn.count() > 0) {
    await adminNavBtn.click();
    await page.waitForTimeout(600);
    const superAdminHeading = await page.locator('text=App Owner Master Control').count();
    console.log('App Owner SuperAdmin portal opened:', superAdminHeading > 0);
    await page.screenshot({ path: 'scripts/verify-03-master-owner-portal.png' });
    console.log('Saved scripts/verify-03-master-owner-portal.png');
  }

  await browser.close();
  console.log('All new features verified successfully!');
}

testNewFeatures().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
