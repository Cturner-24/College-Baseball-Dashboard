---
name: Stadium Broadcast
colors:
  surface: '#f6fafe'
  surface-dim: '#d6dade'
  surface-bright: '#f6fafe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f4f8'
  surface-container: '#eaeef2'
  surface-container-high: '#e4e9ed'
  surface-container-highest: '#dfe3e7'
  on-surface: '#171c1f'
  on-surface-variant: '#434655'
  inverse-surface: '#2c3134'
  inverse-on-surface: '#edf1f5'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#ae0010'
  on-tertiary: '#ffffff'
  tertiary-container: '#d52022'
  on-tertiary-container: '#ffecea'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb4ab'
  on-tertiary-fixed: '#410002'
  on-tertiary-fixed-variant: '#93000b'
  background: '#f6fafe'
  on-background: '#171c1f'
  surface-variant: '#dfe3e7'
  navy-mid: '#1e3a5f'
  win-green: '#15803d'
  runner-orange: '#f97316'
  amber-warning: '#fbbf24'
  ball-green: '#22c55e'
  strike-yellow: '#facc15'
  out-red: '#ef4444'
  border-base: '#e2e8f0'
  border-light: '#f0f4f8'
typography:
  nav-brand:
    fontFamily: Inter
    fontSize: 1.05rem
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  hero-headline:
    fontFamily: Inter
    fontSize: 1.55rem
    fontWeight: '800'
    lineHeight: '1.2'
  section-title:
    fontFamily: Inter
    fontSize: 1.4rem
    fontWeight: '800'
    lineHeight: '1.3'
  score-display:
    fontFamily: Inter
    fontSize: 1.15rem
    fontWeight: '800'
    lineHeight: '1'
  table-header:
    fontFamily: Inter
    fontSize: 0.82rem
    fontWeight: '700'
    lineHeight: '1.5'
  body-data:
    fontFamily: Inter
    fontSize: 0.82rem
    fontWeight: '400'
    lineHeight: '1.5'
  badge-label:
    fontFamily: Inter
    fontSize: 0.68rem
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  metadata:
    fontFamily: Inter
    fontSize: 0.72rem
    fontWeight: '400'
    lineHeight: '1.4'
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: '800'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 14px
  xl: 16px
  container-max: 1100px
  gutter: 16px
---

## Brand & Style

This design system embodies a **Corporate / Modern** aesthetic tailored for the high-intensity world of sports media. It mimics the authoritative, data-dense atmosphere of premium sports broadcasting networks, balancing professional reliability with athletic energy.

The system utilizes a **Hybrid-Themed approach** to define the user experience:
- **Light "Analytic" Mode:** Used for data-heavy surfaces like standings, player stats, and news feeds. It prioritizes clarity, high contrast, and rapid scannability using crisp white surfaces and light slate backgrounds.
- **Dark "Stadium" Mode:** Reserved for navigation and live "Gamecast" environments. It utilizes deep midnight tones to evoke the feeling of being under stadium lights, focusing the user's attention on real-time game action and live scores.

The emotional response should be one of **authority, precision, and excitement**. It feels like a professional tool for power users and passionate fans who demand immediate access to deep-layer statistics without visual clutter.

## Colors

The color strategy is divided into functional roles that reinforce the hybrid-theme narrative:

- **Primary & Interactive:** Blue (`#2563eb`) is the dedicated action color for buttons, active states, and focus indicators.
- **Surface Foundations:** The palette shifts between "Navy Deep" (`#0f172a`) for cinematic dark headers/live views and "Page BG" (`#f1f5f9`) for the analytical data canvas.
- **Semantic Feedback:**
    - **Live/Alert:** Red (`#dc2626`) is reserved for live game states and pulsing indicators.
    - **Success/Win:** Green (`#15803d`) denotes victories and league leaders.
    - **Sport-Specific:** Orange (`#f97316`) is used specifically for baseball-specific states like occupied runners on base.
- **Dynamic Theming:** The design system is intended to be augmented by team-specific accent colors. These should be applied to container borders (left-accents) and subtle background tints to provide immediate visual context for specific matchups.

## Typography

The typography system is built on **Inter**, chosen for its exceptional legibility at small sizes and high-density data layouts.

- **Weight as Hierarchy:** The system relies heavily on weight shifts (400 to 800) to distinguish between participants and winners. Winning teams and scores must always snap to a higher weight.
- **Compact Scannability:** For tabular data and secondary labels, font sizes are kept intentionally small (0.82rem) to allow for high data density without overwhelming the user.
- **Athletic Cues:** Headlines and brand elements use extra-bold weights and tighter letter spacing to mimic the "impact" of sports journalism.
- **Visual Distinction:** All-caps are used sparingly but strictly for status badges (LIVE, FINAL) and table headers to create clear structural anchors.

## Layout & Spacing

This design system uses a **Fixed Grid** philosophy for the primary content area to maintain a professional, editorial feel, while allowing the shell (nav and hero) to span the viewport.

- **Grid Model:** A 12-column system is used with a maximum content width of `1100px`. 
- **Density:** The system utilizes a "Tight Rhythm." Horizontal and vertical gaps between game cards and data blocks are set to `14px` (LG) rather than standard larger increments to maintain high information density.
- **Component Padding:** Standard cards use `16px` internal padding, while dense tables drop to `8px` or `12px` vertical padding per row.
- **Responsive Adaptation:** 
  - **Desktop:** Multi-column layouts (3-4 columns for game cards).
  - **Mobile:** Content reflows into a single-column stack. Typography scales down slightly, and secondary table columns (e.g., season records) are hidden to prevent horizontal scrolling of the main page.

## Elevation & Depth

Visual hierarchy is primarily established through **Tonal Layers** and **Low-Contrast Outlines**, accented by deep shadows only on the highest-priority floating elements.

- **Base Elevation:** Cards use a thin `1px` border (`#e2e8f0`) and a very soft, low-opacity shadow (`0 1px 4px rgba(0,0,0,0.06)`) to stay grounded on the light background.
- **Interactive Lift:** Upon hover, cards should "lift" using a subtle Y-axis translation (-2px) and a deepening of the shadow to indicate interactivity.
- **Dark Surface Depth:** On dark backgrounds (Gamecast), depth is achieved via **Glassmorphism**. Surface panels use semi-transparent white overlays (`rgba(255,255,255,0.07)`) with backdrop blurs to create a sense of layered glass under stadium lights.
- **Status Elevation:** "Live" cards are elevated not just by shadow, but by a "Glow" effect—a secondary red outer border or shadow that pulses to draw immediate attention.

## Shapes

The shape language is **Rounded**, using a sophisticated range of radii to distinguish between different component scales:

- **Pills (Full):** Used for status badges, sport selectors, and "active runner" indicators to provide a friendly, modern contrast to the rigid data grids.
- **Large Components (14px):** Primary game cards and content containers. This softens the high-density data and makes the interface feel accessible.
- **Modals (18px):** The softest radius in the system, used to signify the highest level of the UI stack.
- **Interactive Elements (8px):** Buttons and input fields use a standard rounded corner to balance efficiency with the overall soft-geometric aesthetic.

## Components

### Buttons & Pills
- **Primary Buttons:** High-contrast blue fill with white text and `8px` corners.
- **Sport Selector Pills:** Fully rounded (`999px`). The active state uses a solid blue fill, while inactive states use a `2px` border with gray text.
- **Navigation Arrows:** Circular (`50%` radius) with a border; used for date navigation and carousel controls.

### Cards & Data Tables
- **Game Cards:** White background, `14px` radius. Features two rows for teams. Winning team names and scores must be bolded and colored in `text-primary`.
- **Live State:** Cards for active games must include a red border and a pulsing "LIVE" badge.
- **Data Tables:** Use `border-light` (`#f0f4f8`) for row separators. Table headers should be sticky during long scrolls, using the `navy-mid` background or a solid white with a bottom border.

### Status Indicators
- **Badges:** Small, all-caps labels with high-contrast background tints (e.g., `live-red-bg`, `win-green-bg`).
- **Gamecast Indicators:** In the dark "stadium" view, ball/strike/out counts are represented by colored dots (`#22c55e`, `#facc15`, `#ef4444`). Empty states must be visible but low-contrast (`rgba(255,255,255,0.15)`).

### Inputs
- **Search/Filters:** Clean white backgrounds with `border-base` and a small `8px` radius. Focus states must use the `primary-blue` as a `2px` ring.