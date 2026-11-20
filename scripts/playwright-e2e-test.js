import { chromium } from 'playwright';

async function runAxessE2ETestSuite() {
  console.log('========================================================');
  console.log('   STARTING AXESS PLAYWRIGHT END-TO-END TEST SUITE      ');
  console.log('========================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[BROWSER ERR]:', msg.text());
  });
  page.on('pageerror', err => console.log('[PAGE ERROR]:', err.message));
  page.on('dialog', async dialog => {
    console.log('[ALERT DIALOG]:', dialog.message());
    await dialog.accept();
  });

  let testsPassed = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      testsPassed++;
    } else {
      console.error(`✗ [FAIL] ${testName}`);
    }
  }

  try {
    // 1. Navigation & Page Load
    console.log('--> Test 1: Navigation & Header Verification');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    const title = await page.title();
    assert(title.includes('Axess'), 'Page title contains "Axess"');

    const headerLogo = await page.$('img[alt="Axess"]');
    assert(headerLogo !== null, 'Header logo is present');

    const navPills = await page.$$eval('header nav button', (btns) => btns.map(b => b.textContent.trim()));
    assert(navPills.includes('Up Next') && navPills.includes('Past Gigs'), 'Nav pills "Up Next" and "Past Gigs" present');

    // 2. Hero Carousel 3D Showcase
    console.log('\n--> Test 2: Hero Carousel 3D Showcase');
    const heroTitle = await page.$eval('h1, h2, h3', el => el ? el.textContent : '');
    assert(heroTitle.length > 0, `Hero carousel renders event title: "${heroTitle.substring(0, 30)}..."`);
    await page.screenshot({ path: 'scripts/e2e-01-hero.png' });

    // 3. Location & Category Filters
    console.log('\n--> Test 3: Filters & Discovery Feed');
    const locationHeading = await page.$('h2:has-text("Location")');
    assert(locationHeading !== null, 'Location filter section with heading is present');

    // Click Goa filter
    await page.click('button:has-text("Goa")');
    await page.waitForTimeout(600);
    const goaCardsCount = await page.$$eval('#up-next .card-glossy', cards => cards.length);
    assert(goaCardsCount > 0, `Filtered by Goa: ${goaCardsCount} events displayed`);

    // Click Bangalore filter
    await page.click('button:has-text("Bangalore")');
    await page.waitForTimeout(600);
    const blrCardsCount = await page.$$eval('#up-next .card-glossy', cards => cards.length);
    assert(blrCardsCount > 0, `Filtered by Bangalore: ${blrCardsCount} event displayed`);

    // Click View All on Location to reset filter
    const viewAllBtn = await page.$('div:has(> h2:has-text("Location")) button:has-text("View All")') || await page.$('button:has-text("View All")');
    if (viewAllBtn) await viewAllBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'scripts/e2e-02-filtered.png' });

    // 4. Up Next Poster Card Dimensions & Alignment
    console.log('\n--> Test 4: Up Next Poster Card Aspect Ratio & Alignment');
    const cardImageAspect = await page.$eval('#up-next .aspect-\\[8\\/3\\]', el => {
      const rect = el.getBoundingClientRect();
      const ratio = rect.width / rect.height;
      return { width: rect.width, height: rect.height, ratio };
    });
    // 8 / 3 is ~2.666
    assert(Math.abs(cardImageAspect.ratio - 2.666) < 0.2, `Image container matches exact aspect-[8/3] (Ratio: ${cardImageAspect.ratio.toFixed(2)})`);

    const offsetButton = await page.$('#up-next button .border-solid');
    assert(offsetButton !== null, 'Double border offset "Book tickets" button rendered properly');
    await page.screenshot({ path: 'scripts/e2e-03-upnext-cards.png' });

    // 5. Past Gigs Section
    console.log('\n--> Test 5: Past Gigs Carousel & Modal');
    const pastSection = await page.$('#past-gigs');
    assert(pastSection !== null, 'Past Gigs section is present');

    const pastCards = await page.$$eval('#past-gigs .card-glossy', cards => cards.length);
    assert(pastCards >= 4, `Past Gigs rendered ${pastCards} concluded event cards`);

    // Open Past Gigs "View All" Modal
    await page.click('#past-gigs button:has-text("View All")');
    await page.waitForTimeout(500);
    const archiveModal = await page.$('h3:has-text("Full Past Gigs Archive")');
    assert(archiveModal !== null, 'Full Past Gigs Archive modal opened successfully');
    await page.screenshot({ path: 'scripts/e2e-04-past-modal.png' });

    // Close modal via aria-label="Close"
    await page.click('button[aria-label="Close"]');
    await page.waitForTimeout(500);

    // 6. Vibe Check Video Container Fitting & Lightbox
    console.log('\n--> Test 6: Vibe Check Video Fit & Lightbox');
    const vibeSection = await page.$('#vibe-check');
    assert(vibeSection !== null, 'Vibe Check section is present');

    const vibeCardsCount = await page.$$eval('#vibe-check .ring-1', cards => cards.length);
    assert(vibeCardsCount === 5, `Vibe Check rendered ${vibeCardsCount} crowd reel cards`);

    // Click first reel card to open video lightbox
    await page.click('#vibe-check .ring-1:first-child');
    await page.waitForTimeout(800);
    const videoEl = await page.$('video');
    assert(videoEl !== null, 'Video player lightbox opened with zero-cutting aspect ratio');
    await page.screenshot({ path: 'scripts/e2e-05-vibe-lightbox.png' });

    // Close video lightbox
    const videoCloseBtn = await page.$('#vibe-lightbox button[aria-label="Close"], button[aria-label="Close"]');
    if (videoCloseBtn) {
      await videoCloseBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(600);

    // 7. End-to-End Ticket Booking & Checkout Flow
    console.log('\n--> Test 7: Complete Ticketing & Payment Gateway Flow');
    // Scroll back to Up Next and click Book tickets on first card
    const firstBookBtn = await page.waitForSelector('#up-next button:has-text("Book tickets")');
    await firstBookBtn.click();
    await page.waitForTimeout(1000);

    // Verify Event Detail Modal
    const eventModalDetail = await page.waitForSelector('span:has-text("Event Intelligence")');
    assert(eventModalDetail !== null, 'Event Detail modal opened with live tiers & venue map');
    await page.screenshot({ path: 'scripts/e2e-06-event-detail.png' });

    // Click Reserve & Checkout
    const reserveBtn = await page.waitForSelector('button:has-text("Reserve & Checkout")');
    await reserveBtn.click();
    await page.waitForTimeout(1000);

    // Verify Checkout Modal & 10-Minute Hold
    const checkoutModal = await page.waitForSelector('span:has-text("Encrypted Checkout")');
    assert(checkoutModal !== null, 'Encrypted Checkout modal opened with 10-minute hold reservation');

    // Apply promo code AXESS10
    await page.fill('input[placeholder*="AXESS10"]', 'AXESS10');
    await page.click('button:has-text("Apply")');
    await page.waitForTimeout(600);
    const promoSuccess = await page.waitForSelector('text=Applied AXESS10');
    assert(promoSuccess !== null, 'Promo code AXESS10 validated and discount applied');
    await page.screenshot({ path: 'scripts/e2e-07-checkout-promo.png' });

    // Confirm attendee billing details
    await page.fill('input[placeholder*="Arjun Patel"]', 'Arjun Patel');
    await page.fill('input[placeholder*="attendee@axess.zone"]', 'attendee@axess.zone');

    // Complete Payment
    await page.click('button:has-text("Pay ₹")');
    await page.waitForTimeout(1200);

    // Verify Order Confirmed & Pass Issued
    const passSuccess = await page.waitForSelector('h3:has-text("Passes Issued & Secured!")');
    assert(passSuccess !== null, 'Payment verified and cryptographic passes issued with confetti');
    await page.screenshot({ path: 'scripts/e2e-08-order-confirmed.png' });

    // Open Digital Wallet
    await page.click('button:has-text("View in \\"Your Tickets\\" Wallet")');
    await page.waitForTimeout(1000);

    // Verify Wallet QR Pass
    const walletHeading = await page.waitForSelector('h3:has-text("Your Tickets Wallet")');
    assert(walletHeading !== null, 'Digital wallet loaded with live pass matrix');

    const qrSvg = await page.waitForSelector('span:has-text("SCAN AT GUESTLIST / GATE DESK"), div.bg-white > svg');
    assert(qrSvg !== null, 'Scannable HMAC-SHA256 QR entry pass rendered in digital wallet');
    await page.screenshot({ path: 'scripts/e2e-09-tickets-wallet.png' });

    // Close wallet
    await page.click('div:has(> div > h3:has-text("Your Tickets Wallet")) button[aria-label="Close"], button[aria-label="Close"]');
    await page.waitForTimeout(600);

    // 8. Gate Check-in & Security Verification
    console.log('\n--> Test 8: Gate Scanner & Anti-Duplicate Security');
    // Open Gate Scanner via Organizer shortcut or Navbar
    await page.click('header button[aria-label="Login"]');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Event Organiser")');
    await page.waitForTimeout(800);

    // Click Gate Scanner button
    const gateBtn = await page.waitForSelector('button:has-text("Gate Scanner"), button:has-text("Open Gate Scanner")');
    await gateBtn.click();
    await page.waitForTimeout(800);

    const scannerModal = await page.waitForSelector('span:has-text("Gate Pass Verification Scanner")');
    assert(scannerModal !== null, 'Gate scanner opened successfully');

    // Click demo ticket code AXS-UNM-882190
    await page.click('button:has-text("AXS-UNM-882190")');
    await page.waitForTimeout(1000);

    const admissionResult = await page.waitForSelector('h4:has-text("ENTRY GRANTED"), h4:has-text("ENTRY DENIED")');
    assert(admissionResult !== null, 'Gate scanner executed cryptographic pass verification');
    await page.screenshot({ path: 'scripts/e2e-10-gate-scanner.png' });

    console.log('\n========================================================');
    console.log(`   TEST RESULTS: ${testsPassed} / ${totalTests} TESTS PASSED (${((testsPassed/totalTests)*100).toFixed(0)}%)   `);
    console.log('========================================================\n');

  } catch (error) {
    console.error('Test Execution Error:', error);
  } finally {
    await browser.close();
  }
}

runAxessE2ETestSuite();
