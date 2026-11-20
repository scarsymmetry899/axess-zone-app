---
name: Cyber Underground
colors:
  surface: '#121315'
  surface-dim: '#121315'
  surface-bright: '#38393b'
  surface-container-lowest: '#0d0e10'
  surface-container-low: '#1b1c1e'
  surface-container: '#1f2022'
  surface-container-high: '#292a2c'
  surface-container-highest: '#343537'
  on-surface: '#e3e2e5'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e3e2e5'
  inverse-on-surface: '#303033'
  outline: '#849495'
  outline-variant: '#3a494b'
  surface-tint: '#00dce6'
  primary: '#e0fdff'
  on-primary: '#00373a'
  primary-container: '#00f2fe'
  on-primary-container: '#006a70'
  inverse-primary: '#00696f'
  secondary: '#ffb1c4'
  on-secondary: '#65002e'
  secondary-container: '#ff4a8d'
  on-secondary-container: '#590028'
  tertiary: '#f6f7ff'
  on-tertiary: '#2d3038'
  tertiary-container: '#d9dae4'
  on-tertiary-container: '#5d5f67'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ff6ff'
  primary-fixed-dim: '#00dce6'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f53'
  secondary-fixed: '#ffd9e1'
  secondary-fixed-dim: '#ffb1c4'
  on-secondary-fixed: '#3f001a'
  on-secondary-fixed-variant: '#8f0044'
  tertiary-fixed: '#e0e2eb'
  tertiary-fixed-dim: '#c4c6cf'
  on-tertiary-fixed: '#191c22'
  on-tertiary-fixed-variant: '#44474e'
  background: '#121315'
  on-background: '#e3e2e5'
  surface-variant: '#343537'
  surface-elevated: '#16181D'
  surface-border: '#262930'
  text-primary: '#FFFFFF'
  text-muted: '#9CA3AF'
  text-dim: '#6B7280'
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.04em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies the electric pulse of nightlife, underground music scenes, and cutting-edge electronic festivals. The visual style merges modern minimalism with high-contrast cyberpunk utility—engineered for high-stimulus, low-light environments. 

The aesthetic is precise, unapologetic, and hyper-focused. Deep void-like backdrops frame piercing, luminescence-driven accents that command immediate action. Interfaces reflect physical club wristbands, digital guestlists, high-tech access badges, and hardware audio gear. The experience prioritizes instant scanability, frictionless high-speed checkout, and immersive dark mode fidelity.

## Colors

The palette revolves around deep optical pitch black and radiant laser accents:

- **Primary (`#00F2FE` - Electric Cyan):** Used for focal points, checkout paths, primary action buttons, active navigation markers, and digital ticket barcodes.
- **Secondary (`#FF007F` - Neon Hot Magenta):** Reserved strictly for scarcity indicators, "Sold Out Soon" banners, live set alerts, VIP access tiers, and urgent system states.
- **Neutral Canvas (`#0B0C0E`):** Pure deep charcoal canvas, minimizing battery drain on OLED screens and eliminating eye strain in dark club venues.
- **Elevated Surface (`#16181D`):** Applied to cards, bottom sheets, navigation bars, and modals to create subtle physical separation without breaking dark harmony.
- **Structural Outlines (`#262930`):** Fine technical borders framing touch targets and dividing content zones.
- **Typography Spectrum:** Pure White (`#FFFFFF`) for razor-sharp headlines, Muted Gray (`#9CA3AF`) for body and secondary context, and Dim Gray (`#6B7280`) for metadata, timestamps, and venue fine print.

## Typography

The pairing combines the mechanical, synthetic edge of **Space Grotesk** with the neutral, hyper-legible utility of **Inter**:

- **Space Grotesk** drives headlines, pricing numerals, lineup billings, and badges. Its geometric, slightly brutalist angles channel underground flyer culture and synth control interfaces. All labels leverage uppercase tracking to evoke digital access passes.
- **Inter** handles narrative text, terms, venue directions, and long-form descriptions, preserving optimal optical legibility on dark backgrounds under erratic club lighting.

## Layout & Spacing

The interface follows a mobile-first fluid grid structured around a consistent 4px/8px rhythm:

- **Mobile (< 768px):** 4-column layout with 16px margins and 16px gutters. Edge-to-edge full-bleed display imagery for artist announcements and lineup posters, pinned sticky checkout drawers, and thumb-accessible navigation rails.
- **Tablet (768px – 1024px):** 8-column layout with 24px margins and 16px gutters. Dynamic dual-column event split (imagery and line-up on the left; ticket tier selector on the right).
- **Desktop (> 1024px):** 12-column layout capped at 1280px max-width, with 40px outer margins and 24px gutters. Center-anchored stage overviews, festival schedules, and multi-tier pass checkout flows.

## Elevation & Depth

This design system rejects conventional blurry drop-shadows in favor of tonal layered surfaces, sharp borders, and localized luminescence:

- **Base Void (`#0B0C0E`):** Root background level.
- **Level 1 Surface (`#16181D`):** Applied to cards, interactive modules, and lists. Enclosed by a 1px solid border of `#262930`.
- **Level 2 Overlay (`#1C1F26`):** Modals, flyout menus, and action drawers.
- **Cybernetic Glow / Phosphor Radiance:** Active CTAs, selected seats, and valid entry passes emit a concentrated neon halo:
  - **Electric Cyan Glow:** `0px 0px 20px rgba(0, 242, 254, 0.35)`
  - **Magenta Urgency Glow:** `0px 0px 16px rgba(255, 0, 127, 0.40)`
- **Glass Shrouds:** Modal backdrops and floating navigation use `rgba(11, 12, 14, 0.82)` with a `16px` backdrop blur to keep the background music artwork subtly visible.

## Shapes

The shape architecture relies on a strict dual-geometry paradigm:

- **Container Surfaces (`rounded-lg` / 16px):** Event cards, lineup containers, ticket wallets, and modal sheets are fixed at 16px border-radius, presenting a sleek, refined silhouette.
- **Interactive Controls & Tags (`rounded-xl` / 24px+ Pill):** Buttons, filter pills, badge tags, and search bars employ high-curvature pill geometry, ensuring tactile recognition against squared card frameworks.
- **Technical Notches (Optional accent):** Barcode wrappers and digital pass stubs may feature semi-circular side-notches to evoke vintage punch-card tickets.

## Components

### Buttons
- **Primary Action (Cyan Pill):** Filled with `#00F2FE`, text in `#0B0C0E` (`label-lg`, weight 700), height 52px, border-radius 24px. Emits a cyan neon glow on hover and focus.
- **Urgent Action (Magenta Pill):** Filled with `#FF007F`, text in `#FFFFFF`, with a vibrant glow effect. Used for "Buy Now", "Claim Drop", or flash releases.
- **Secondary (Ghost Outline):** Transparent background, 1.5px border in `#262930`, text in `#FFFFFF`. On hover, border shifts to `#00F2FE` with 10% opacity fill.
- **Icon Actions:** 44px circular or pill frames with `#16181D` background and `#262930` border.

### Chips & Filter Pills
- **Inactive:** Height 36px, radius 24px, background `#16181D`, border `#262930`, typography `label-md` in `#9CA3AF`.
- **Active:** Height 36px, background `#00F2FE`, text `#0B0C0E`, font weight 700, with an electric cyan ambient glow.

### Cards & Event Modules
- Background `#16181D`, border 1px solid `#262930`, radius 16px, inner padding 16px.
- Images feature an ambient dark gradient overlay (`rgba(11,12,14,0.6)` at bottom) to guarantee white text readability.
- Event status chips (e.g., "ALMOST GONE", "VIP") pin to the top-right corner.

### Inputs & Search
- Field background `#16181D`, border 1px solid `#262930`, radius 24px for search inputs, 12px for checkout forms.
- Text in `#FFFFFF` with placeholder in `#6B7280`.
- Focus state activates a 1.5px border of `#00F2FE` and a subtle glow.

### Checkboxes & Radio Toggles
- Custom 20px boxes/circles with a `#262930` perimeter on `#16181D`.
- Selected state fills with `#00F2FE`, rendering an `#0B0C0E` internal icon.

### Access Pass / Digital Ticket Component
- Dedicated wallet card utilizing level-1 surface (`#16181D`) with subtle radial laser gradients.
- High-contrast animated QR/Barcode field placed in a stark pure white (`#FFFFFF`) cutout for reliable scanner reading in dark venues.
- Scannable validation bar featuring dynamic pulsing cyan glow for anti-counterfeit live verification.