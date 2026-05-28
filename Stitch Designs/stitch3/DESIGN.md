---
name: Bit-Perfect Arena
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c8c5d0'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#918f9a'
  outline-variant: '#47464f'
  surface-tint: '#c1c1fe'
  primary: '#c1c1fe'
  on-primary: '#2a2b5d'
  primary-container: '#121245'
  on-primary-container: '#7c7db5'
  inverse-primary: '#58598f'
  secondary: '#ffb2b8'
  on-secondary: '#67001d'
  secondary-container: '#ff506e'
  on-secondary-container: '#5b0018'
  tertiary: '#00e639'
  on-tertiary: '#003907'
  tertiary-container: '#001f02'
  on-tertiary-container: '#009722'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1dfff'
  primary-fixed-dim: '#c1c1fe'
  on-primary-fixed: '#141447'
  on-primary-fixed-variant: '#414275'
  secondary-fixed: '#ffdadb'
  secondary-fixed-dim: '#ffb2b8'
  on-secondary-fixed: '#40000f'
  on-secondary-fixed-variant: '#91002d'
  tertiary-fixed: '#72ff70'
  tertiary-fixed-dim: '#00e639'
  on-tertiary-fixed: '#002203'
  on-tertiary-fixed-variant: '#00530e'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Space Mono
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -2px
  headline-lg:
    fontFamily: Space Mono
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  score-display:
    fontFamily: Space Mono
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 4px
  body-md:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
  headline-lg-mobile:
    fontFamily: Space Mono
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
spacing:
  pixel_unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
  container-max: 1200px
---

## Brand & Style

The design system adopts a **Retro / 16-bit** aesthetic, drawing heavy inspiration from the golden era of arcade and console sports titles. The target audience consists of gaming enthusiasts and nostalgic sports fans who value personality and high-energy visuals over sterile corporate layouts.

The UI is built on a "Pixel-First" philosophy. There are no photographic elements or soft gradients; every visual component is rendered as if constrained by a 16-bit color palette and resolution. The emotional response is one of high-stakes competition, urgency, and tactile fun. The style is characterized by hard edges, saturated color blocks, and a distinctive "arcade cabinet" glow.

## Colors

The foundation is a deep **Midnight Navy** (#121245), providing a stable backdrop for high-contrast "score bug" colors. The system utilizes vibrant, saturated hues to represent team identities and action states:

- **Primary:** Deep Navy for core UI backgrounds.
- **Secondary:** Cyber Pink for critical actions and highlights.
- **Tertiary:** Matrix Green for "Live" status, scores, and positive data.
- **Team Colors:** High-saturation pairings (Gold/Orange vs Cyan/Blue) ensure that individual teams pop against the dark canvas, mimicking the color-cycling techniques of retro hardware.

Avoid transparency; use solid dithered patterns if a "fade" is required.

## Typography

This design system utilizes technical, monospaced typefaces to emulate pixel-grid rendering. **Space Mono** serves as the primary display face for all headings, scores, and labels, providing a rigid, geometric structure. **JetBrains Mono** is used for body text to maintain a technical feel while ensuring legibility for longer stats or descriptions.

- **Headings & Labels:** Always uppercase to maximize the "arcade" impact.
- **Scores:** Rendered at maximum scale with increased letter spacing to dominate the visual hierarchy.
- **Anti-aliasing:** Should be disabled or set to "pixelated" in CSS where possible to maintain sharp edges on all glyphs.

## Layout & Spacing

The layout follows a **Fixed Grid** model based on a 4px "pixel unit." All margins, paddings, and component sizes must be multiples of 4px to ensure alignment with the perceived pixel grid.

- **Desktop:** 12-column grid with 16px gutters and large 32px safety margins.
- **Mobile:** 4-column grid with 16px margins. 
- **Alignment:** Content should be strictly snapped to the grid. Avoid fluid percentages for width; use specific column spans to maintain the chunky, structured feel of a vintage game UI.

## Elevation & Depth

Depth is achieved through **Bold Borders** and **Tonal Layers** rather than shadows. In a 16-bit world, light is directional and binary.

- **Stacking:** Higher elevation is indicated by lighter background shades and thicker, high-contrast borders (e.g., a 2px "highlight" border on the top and left, and a 2px "shadow" border on the bottom and right).
- **Hard Shadows:** If a shadow is required for a floating modal, use a solid, offset block of 100% black (e.g., `4px 4px 0px #000000`).
- **No Blurs:** Gaussian blurs and soft shadows are strictly forbidden.

## Shapes

The shape language is **Strictly Sharp (0)**. There are no rounded corners in this design system. 

Every button, card, and input is a perfect rectangle. To simulate "rounded" corners in a pixel-art style, use "stepped" corners where a single pixel is removed from the absolute corner, creating a 45-degree notch, but maintain a baseline of 90-degree angles for all structural containers.

## Components

- **Buttons:** Rectangular with a 2px solid border. Use a "pressed" state that offsets the label by 2px down and right to simulate physical travel.
- **Score Bugs:** Compact blocks using high-contrast team colors. Scores are centered in a black box within the bug, utilizing the `score-display` type style.
- **Input Fields:** Black background with a primary color border. The cursor should be a solid, blinking block.
- **Cards:** Use a "beveled" look created with solid lines—lighter colors on the top/left edges and darker on the bottom/right.
- **Lists:** Separated by 2px solid horizontal lines. Row highlights use the secondary color at 100% opacity.
- **Progress Bars:** Segmented into discrete blocks (e.g., 10 blocks representing 100%) rather than a smooth continuous fill.