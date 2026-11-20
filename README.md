# Axess (axess.zone) — Live Event Discovery, Ticketing & Partner Platform

[![Production Deployment](https://img.shields.io/badge/Vercel-Production%20Live-black?style=for-the-badge&logo=vercel)](https://frontend-mu-dusky-39.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/scarsymmetry899/axess-zone-app)
[![Tests Passing](https://img.shields.io/badge/Playwright%20E2E-58%2F58%20Passed%20(100%25)-success?style=for-the-badge&logo=playwright)](https://playwright.dev)

A full-stack, real-time live event discovery, ticketing, and partner-management platform modeled after **Axess (`axess.zone`)**, built with a **strictly monochromatic dark-neutral design system**, open guest browsing, multi-role login portals, direct real-time synchronization with `api.axess.zone`, ticket reservation hold engine, Razorpay checkout, peer-to-peer anti-fraud ticket transfers (District / DICE model), location-targeted notifications, and cart retargeting.

---

## 1. Visual System & Monochromatic Dark-Neutral Fidelity

The UI strictly adheres to the authentic Axess aesthetic:
- **Canvas / Void**: True charcoal to near-black (`#0A0A0C` to `#111215`).
- **Surface Elevation**: Dark neutral card surfaces (`#16171B`) and nested containers (`#1C1D22`).
- **Technical Hairlines**: 1px subtle borders (`#24262D`).
- **Typography Spectrum**:
  - Primary Headlines: Crisp White (`#FFFFFF`) in **Lexend**.
  - Dates, Venues & Metadata: Muted Light Gray (`#A1A1AA`) in **Poppins** and **Lexend**.
  - Secondary Captions & Monospace Identifiers: Dim Gray (`#71717A`).
- **Pure Monochrome**: Strictly **NO** neon cyan/pink accents or unrequested badges. Event artwork carries all natural visual contrast and color.

---

## 2. Completed Core Features (Phase 1)

### A. Discovery Flow & Branding
- **Top Navigation Bar**: AXESS header mark, section anchors ("Up Next", "Past Gigs", "Vibe Check"), real-time WebSocket connection indicator, Notification Bell with live unread badge, "Your Tickets" wallet, and multi-role Login modal.
- **Hero Showcase Carousel**: 3D perspective carousel with marquee events:
  - *UNMADA VARA NYE - The Pulse of Prāṇa* (Dec 31, 2026 • Goa)
  - *Primal Void* (Dec 24 – 26, 2026 • Goa)
  - *Perseverance Festival* (Dec 26 – 28, 2026 • Goa)
  - *Ritual Of The Void Goa* (Dec 28 – 29, 2026 • Goa)
  - *Dark Obscura* (Nov 21, 2026 • Goa)
- **Filter Strips**: Location chips ("All", "Goa", "Bangalore", "Kasol", "Mumbai", "Delhi") and category chips ("Music", "Nightlife", "Festival", "Community", "Arts & Theatre", etc.).
- **Authentic Two-Column Event Details**:
  - Left: High-resolution vertical poster card (`rounded-[14px]`).
  - Right: Ticket Information box with tier rows, pricing in ₹, "Tier Closed" vs. green "Available Now", quantity selector, and dual action buttons (`+ Add to Cart` and `Book Tickets`).
  - About Event section with presenter subtitle, `When? 🗓️` and `Where? 📍`.
  - **OpenStreetMap Leaflet Map**: Custom green map pin centered on exact coordinates with zero API key errors.
  - **Explicit Refund Terms**: Prominently highlights `🚫 Strict No-Refund Policy` vs. `🔄 Refund Window: 48H Prior`.

### B. Free Browsing + Multi-Role Access Control (RBAC)
- Unauthenticated visitors can freely browse all public discovery feeds, event details, filters, and media.
- Dedicated **Login Modal** with 5 selectable roles + **"Browse without logging in"** guest escape:
  | Role | Demo Credentials | Capabilities |
  | :--- | :--- | :--- |
  | **`USER` (Attendee)** | `user@axess.zone` / `axess2026` | Ticket wallet with active passes, order history, scannable QR passes, and P2P ticket transfers. |
  | **`ORGANIZER`** | `organizer@axess.zone` / `axess2026` | Organizer Studio: Create/edit events, toggle tier availability, view sales, and gate check-in scanner. |
  | **`PROMOTER`** | `promoter@axess.zone` / `axess2026` | Promoter Hub: Track attributed ticket sales, monitor 10% commission earnings, copy referral links, and promo codes (`AXESS10`). |
  | **`SPONSOR`** | `sponsor@axess.zone` / `axess2026` | Sponsor Deck: Partnership packages, stage naming rights, media kits, and sponsorship inquiries. |
  | **`ADMIN` (App Owner)** | `admin@axess.zone` / `axess2026` | Master SuperAdmin authority: Global metrics, live tier toggles, website sync engine, notifications setup, and retargeting campaigns. |

### C. Live Website Operations & Real-Time Sync (`api.axess.zone`)
- **Direct Upstream Ingestion**: Connects directly to `https://api.axess.zone/api/v1/hero-slides` and `/events`.
- **Zero-Interference Automation**: Newly listed events on `axess.zone` are automatically ingested without requiring a person to separately manage the app.
- **WebSocket Broadcast**: Emits `events:feed:update` and `tier:change` so all connected clients update live without page refreshes.
- **Webhook Integration**: Dedicated endpoint `/api/webhooks/website-sync` with HMAC-SHA256 signature verification.

### D. Location-Targeted Notifications & In-App Notification Center
- **SuperAdmin Composer**: Target announcements by location (Goa, Bangalore, Kasol, Mumbai, Delhi) and audience role.
- **Live Smartphone Push Preview**: Real-time mockup showing simulated iOS/Android push notification cards.
- **In-App Slide-Over Drawer**: Click the header Bell icon to open the drawer featuring location chips, gig links, and 1-click promo code copying.

### E. Retargeting Engine & Cart Abandonment Recovery
- **Audience Segments**: Tracks `ABANDONED_CART` users, `REDEEMED_TICKETS` past attendees, and high-engagement browsers.
- **Automated Retention Nudges**: Auto-issues 10% discount codes (`CART10`) 1 hour after cart abandonment.
- **Floating In-App Cart Banner**: Non-intrusive bottom banner allowing users to resume held checkout sessions with discount pre-applied.

### F. Peer-to-Peer Ticket Transfer (District / DICE Anti-Fraud Model)
- **Single-Custody Handover**: Sender enters recipient's email address in their wallet.
- **Anti-Duplication**: Sender's pass status is atomically marked `TRANSFERRED`, and their QR code is permanently revoked.
- **New Pass Issuance**: A brand-new cryptographic pass with a new ticket code and signature is issued directly to the recipient's wallet.
- **Gate Enforcement**: Gate scanners immediately block revoked passes with `ENTRY DENIED: This ticket pass was transferred to another user`.

### G. Analytics & UTM Tracking Engine
- **GA4 Integration**: Official Axess Google Analytics 4 Measurement ID `G-FLHPR19T5T`.
- **UTM Extraction**: Automatically captures `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` from URL query parameters.
- **Order Attribution**: Ingests UTMs into checkout payloads so organizer dashboards show exact campaign attribution.

---

## 3. Technology Stack

- **Backend**: Node.js, Express, Socket.io, SQLite (WAL mode with `better-sqlite3`), JWT auth, bcryptjs, crypto HMAC-SHA256, Node-fetch upstream scraper.
- **Frontend**: React 19, Vite, Tailwind CSS, Leaflet & React-Leaflet (OpenStreetMap), Socket.io-client, Lucide React, qrcode.react, canvas-confetti.
- **Production Infrastructure**: Vercel Serverless Hosting, GitHub Actions CI/CD.

---

## 4. Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
From the project root:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### Running the Application Locally
To run both backend API (port 5000) and frontend client (port 5173) concurrently:
```bash
npm run dev
```

Open your browser to:
- Frontend App: **`http://localhost:5173`**
- Backend Health API: **`http://localhost:5000/api/health`**
- WebSocket Pub-Sub: **`ws://localhost:5000`**

---

## 5. Comprehensive Automated Playwright Test Verification

The application is verified through two end-to-end Playwright audit suites:

```bash
# Run comprehensive 34-check audit (Branding, Auth, Cart, Checkout, Portals, Responsive)
node scripts/comprehensive-e2e-audit.js

# Run 18-check sync, notifications, retargeting & ticket transfer audit
node scripts/verify-sync-notif-retarget.js
node scripts/verify-transfer-refund-utm.js
```

**Audit Result: 58 / 58 Checks Passed (100% Success Rate)**.

---

## 6. Pending in Phase 2 (Roadmap & Implementation Checklist)

The following items are scheduled for **Phase 2** execution to achieve full app store release and third-party SaaS integration:

### 📱 A. Native Mobile App Store Release (Android & iOS)
- [ ] **Capacitor 6 Native Wrapper**:
  - Wrap the production Vite frontend with `@capacitor/core`, `@capacitor/android`, and `@capacitor/ios`.
- [ ] **Google Play Store**:
  - Generate release keystore and compile signed Android App Bundle (`.aab`) targeting Android SDK 34+.
  - Register Google Play Developer Console ($25).
  - Submit under *Physical Goods & Services Outside the App* exemption (exempt from Google Play In-App Billing).
- [ ] **Apple App Store**:
  - Open Xcode workspace, configure Bundle ID `zone.axess.app`, and set up Provisioning Profiles under Apple Developer Program ($99/yr).
  - **Apple Review Guideline 3.1.3(e) Compliance**: Physical live event tickets are exempt from Apple 30% IAP commission; direct payment gateway checkout via Razorpay is permitted.
  - Implement Apple App Privacy Manifest (`PrivacyInfo.xcprivacy`).

### 🔒 B. Hardware & Advanced Anti-Fraud Ticketing
- [ ] **Dynamic Rotating QR Code (TOTP 15-second refresh)**:
  - Generate animated QR codes that refresh every 15 seconds based on a time-based one-time password algorithm, completely rendering static screenshots useless at entrance gates.
- [ ] **Native Camera Gate Scanner**:
  - Integrate `@capacitor-community/barcode-scanner` for continuous high-speed camera scanning at door desks.
- [ ] **Offline Door Sync (PWA / SQLite Cache)**:
  - Allow gate staff in low-connectivity areas (e.g. Kasol / North Goa forest venues) to validate tickets locally against an encrypted cached database with automated reconciliation once back online.
- [ ] **Apple Wallet & Google Wallet Integration**:
  - Server-side generation of signed `.pkpass` files for 1-tap addition to Apple Wallet and Google Pay Passes.

### 🔌 C. Third-Party Integrations & Marketing Automation
- [ ] **WhatsApp Cloud API (Meta Graph API)**:
  - Automated WhatsApp message dispatch delivering PDF tickets, gate directions, and venue advisories immediately after successful payment.
- [ ] **Meta Conversions API (CAPI)**:
  - Server-to-server tracking pipeline sending `Purchase` and `InitiateCheckout` events directly from Node.js backend to Meta Pixel, bypassing iOS Safari cookie restrictions and ad-blockers.
- [ ] **Firebase Cloud Messaging (FCM) & Apple Push Notification Service (APNs)**:
  - Production push notification credentials for background system notifications, gate opening alerts, and 1-hour cart expiration reminders.
- [ ] **Transactional Email Provider (Resend / AWS SES)**:
  - HTML ticket delivery templates with calendar invite attachments (`.ics`).
- [ ] **Sentry Error Monitoring**:
  - SDK integration across frontend and backend for real-time exception logging and performance monitoring.

---

## 7. License & Credits

Built for **Axess (`axess.zone`)**. All trademarks, brand marks, and event poster imagery are the property of their respective organizers and Axess.
