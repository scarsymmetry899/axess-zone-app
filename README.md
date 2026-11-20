# Axess (axess.zone) — Live Event Discovery, Ticketing & Partner Platform

A full-stack, real-time live event discovery and ticketing platform modeled after **Axess (`axess.zone`)**, built with a **strictly monochromatic dark-neutral design system**, public open browsing, multi-role login-gated portals, real-time WebSocket synchronization, ticket reservation hold engine, Razorpay checkout, and scannable cryptographically signed QR access passes with door check-in validation.

---

## 1. Visual System & Monochromatic Dark-Neutral Fidelity

The UI strictly adheres to the authentic Axess aesthetic:
- **Canvas / Void**: True charcoal to near-black (`#0A0A0C` to `#111215`).
- **Surface Elevation**: Dark neutral card surfaces (`#16171B`) and nested containers (`#1C1D22`).
- **Technical Hairlines**: 1px subtle borders (`#24262D`).
- **Typography Spectrum**:
  - Primary Headlines: Crisp White (`#FFFFFF`) in **Space Grotesk**.
  - Dates, Venues & Metadata: Muted Light Gray (`#A1A1AA`) in **Inter** and **Space Grotesk**.
  - Secondary Captions & Monospace Identifiers: Dim Gray (`#71717A`).
- **Pure Monochrome**: Strictly **NO** neon cyan/pink accents, live equalizer bars, or unrequested badges. Event artwork carries all natural visual contrast and color.

---

## 2. Core Functional Architecture

### A. Discovery Flow
- **Top Navigation Bar**: AXESS angled wordmark, section anchors ("Up Next", "Past Gigs", "Vibe Check"), real-time WebSocket connection indicator, "Your Tickets" wallet, and multi-role switch/login dropdown.
- **Hero Showcase Carousel**: Marquee marquee events:
  - *UNMADA VARA NYE - The Pulse of Prāṇa* (Dec 31, 2026 • Goa)
  - *Primal Void* (Dec 24 – 26, 2026 • Goa)
  - *Perseverance Festival* (Jan 15 – 17, 2027 • Goa)
  - *Vanaghotra The Decade Ritual* (Feb 05 – 08, 2027 • Goa)
  - *Dark Obscura* (Nov 21, 2026 • Goa)
  With auto-play, pause-on-hover, slide dots, price ranges in ₹, and stark white "Book Tickets" CTA.
- **Filter Strips**:
  - **Location**: "View All", "Goa", "Bangalore", "Kasol", "Mumbai", "Delhi NCR".
  - **Category**: "View All", "Festival", "Nightlife", "Music", "Community", "Arts & Theatre", "Food & Drink", "Networking", "Technology", "Wellness", "Workshop", "Other".
  - **Live Search**: Instant keyword filtering across event titles, subtitles, and venues.
- **"Up Next" Poster Feed**: Vertical poster cards with artwork on top, date, venue, INR price ranges, and "Book tickets" CTA.
- **"Past Gigs" Archive**: Concluded events formatted with `Date | Venue` (e.g. `Nov 14, 2026 | House Of Chapora, Goa`), with a full modal archive.
- **"Vibe Check" Community Reel**: "Loudest nights. Craziest Crowds. Real Energy - Captured By You.", `socials@axess.zone` contact, `@axess.zone` Instagram link, 9:16 crowd media clips with play lightboxes, and a 32Hz Void Acoustics tuned status widget.
- **Event Detail View**:
  - Narrative gathering overview and curator credits.
  - Interactive **OpenStreetMap / Leaflet** dark map with custom pin and directions link.
  - Multi-tier ticket matrix ("Available Now" vs. "Tier Closed"), perks badges, quantity increment/decrement, and "Reserve & Checkout" trigger.

### B. Free Browsing + Role-Based Access Control (RBAC)
Unauthenticated visitors can freely browse all public discovery feeds, past gigs, vibe check, and event detail views.

Authenticated roles provide dedicated gated management portals:
| Role | Portal / Capabilities |
| :--- | :--- |
| **`USER` (Attendee)** | "Your Tickets" wallet with active passes, order history, scannable QR passes, and print stubs. |
| **`ORGANIZER`** | Create new live events, manage ticket tiers, toggle "Available Now" / "Tier Closed", view sales, and access Gate Scanner. |
| **`PROMOTER`** | Track attributed ticket sales, monitor 10% commission earnings, copy affiliate links, and create custom promo codes. |
| **`SPONSOR`** | Inspect brand sponsorship packages (Headline, Acoustic Partner, VIP Lounge), activations, and submit inquiries. |
| **`ADMIN`** | Platform oversight, gross INR sales volume, active holds monitor, user accounts directory, and simulated live website sync trigger. |

Pre-seeded Demo Accounts for 1-click test login:
- Attendee: `attendee@axess.zone` (pw: `axess123`)
- Event Organiser: `organizer@axess.zone` (pw: `axess123`)
- Promoter: `promoter@axess.zone` (pw: `axess123`, Promo Code: `AXESS10`)
- Sponsor: `sponsor@axess.zone` (pw: `axess123`)
- Admin: `admin@axess.zone` (pw: `axess123`)

### C. Real-Time WebSocket Pub-Sub Synchronization
Built on **Socket.io** with pub-sub rooms:
- `events:feed`: When an organizer creates or edits an event, or an upstream sync webhook triggers, all connected browser clients receive live updates immediately without manual reload.
- `event:{id}:tiers`: When an organizer toggles a tier from "Available Now" to "Tier Closed" or a phase sells out, clients viewing that event modal update in real time.
- `user:{id}:tickets`: Issued passes and gate check-in status stream directly to the attendee's wallet.
- `/api/webhooks/website-sync`: Ingestion endpoint for upstream CMS and website synchronization.

### D. 10-Minute Reservation Holds & Razorpay Gateway Checkout
- **Temporary Ticket Hold**: When checkout starts, a temporary hold (10-minute TTL) is reserved in Redis / memory store and database, decrementing available allocation. An active countdown timer (`09:48`) is displayed.
- **Promo Voucher Engine**: Validates promo codes (`AXESS10`, `EARLYBIRD`, `TECHNO20`), calculates discounts, and attributes orders to promoters.
- **Razorpay Integration**: Server-side order creation (`orders.create`), idempotency tokens, and signed HMAC-SHA256 signature verification.
- **Cryptographic QR Passes**: Issued tickets are signed with HMAC-SHA256 (`CryptoPass`), displayed on high-contrast `#FFFFFF` cutouts for dark venue scanners.
- **Gate Check-In Validator**: Organizers and Admins can scan QR payloads or enter ticket codes at the door. Prevents double check-ins, validates signatures, and marks passes as `CHECKED_IN` in real time.

---

## 3. Technology Stack

- **Backend**: Node.js, Express, Socket.io, SQLite (WAL mode with `better-sqlite3`), optional PostgreSQL adapter (`pg`), optional Redis client (`ioredis`), JWT auth, bcryptjs, crypto HMAC-SHA256.
- **Frontend**: React 19, Vite, Tailwind CSS, Leaflet & React-Leaflet (OpenStreetMap), Socket.io-client, Lucide React, qrcode.react, canvas-confetti.

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

### Running the Application
To start both the Backend (port 5000) and Frontend (port 5173) concurrently:
```bash
npm run dev
```

Or run them in separate terminals:
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

Open your browser to:
- Frontend App: **`http://localhost:5173`**
- Backend Health API: **`http://localhost:5000/api/health`**
- WebSocket Pub-Sub: **`ws://localhost:5000`**

---

## 5. Step-by-Step Verification Guide

1. **Monochromatic Discovery Browsing**:
   - Open `http://localhost:5173`.
   - Observe the dark-neutral styling (`#0A0A0C` background, `#16171B` cards, `#24262D` hairlines, crisp white typography).
   - Test the **Hero Showcase Carousel**: Click arrows or dots to cycle marquee events ("UNMADA VARA NYE", "Primal Void", "Perseverance Festival", "Vanaghotra", "Dark Obscura").
   - Test **Filters**: Click "Goa", "Bangalore", or "Kasol"; click categories "Festival", "Nightlife", "Music"; or type "D Pedro" in the search bar.
   - Test **"Past Gigs"**: Inspect concluded events (`Date | Venue` format) and click "View All" to browse the full archive.
   - Test **"Vibe Check"**: Click any 9:16 crowd card to preview the media lightbox.

2. **Event Detail & Interactive Map**:
   - Click "Book tickets" on *UNMADA VARA NYE*.
   - Inspect the interactive **Leaflet OpenStreetMap** (centered on Vagator Beach, Goa).
   - View the multi-tier matrix: Note that "Early Bird GA" is marked **"Tier Closed"**, while "Phase 1 GA" is **"Available Now"**.

3. **Temporary Hold & Payment Gateway Checkout**:
   - Select "Phase 1 General Admission", choose 2 tickets, and click "Reserve & Checkout".
   - Notice the **10-minute hold reservation timer** (`09:59...`) counting down.
   - Enter promo code `AXESS10` and click "Apply" to receive a 10% discount.
   - Select UPI, Cards, or NetBanking and click "Pay ₹...".
   - Observe the celebratory confetti and order confirmation screen.

4. **"Your Tickets" Wallet**:
   - Click "Your Tickets" in the top navigation bar.
   - View your newly issued pass featuring a scannable **high-contrast QR code** and HMAC cryptographic signature.

5. **Multi-Role Portals & Real-Time Sync**:
   - In the top-right navbar, click the user/role dropdown:
     - **Organiser (`organizer@axess.zone`)**: Open "Organiser Portal". Toggle a tier state (e.g., change "Tier Closed" to "Available Now"). Watch the change broadcast live over WebSockets!
     - **Gate Scanner**: Open the "Gate Scanner", enter `AXS-UNM-882190`, and click "Validate". The pass is immediately admitted (`ENTRY GRANTED`). Try scanning the same code a second time to observe double-entry blocking (`DOUBLE ENTRY BLOCKED`)!
     - **Promoter (`promoter@axess.zone`)**: Open "Promoter Hub" to view attributed ticket sales, copy affiliate links, and create custom discount codes.
     - **Sponsor (`sponsor@axess.zone`)**: Open "Sponsor Portal" to browse partnership decks and submit brand activation proposals.
     - **Admin (`admin@axess.zone`)**: Open "Admin Engine" to see total INR transaction volume, active holds, and trigger live website sync.
