# Baseball Dashboard — Design Brief for Stitch

> A live college baseball and MLB score-tracking dashboard. Think ESPN GameCenter meets the clean, modern aesthetic of mlb.com — data-dense but visually approachable, with bold use of team colors, dark UI accents, and sports-card polish.

---

## 1. Brand & Tone

| Attribute | Description |
|---|---|
| **Product name** | Baseball Dashboard |
| **Tagline** | Live Scores · College & MLB |
| **Audience** | College baseball fans and MLB fans who want a clean, fast scoreboard without noise |
| **Tone** | Authoritative, clean, modern sports media — not playful, not corporate |
| **Inspirations** | mlb.com Gameday, ESPN Scoreboard, The Athletic |

---

## 2. Color Palette

### Core

| Token | Hex | Use |
|---|---|---|
| `navy-deep` | `#0f172a` | Sticky nav background, Gamecast bg, dark accents |
| `navy-mid` | `#1e3a5f` | Division header bars in standings |
| `blue-primary` | `#2563eb` | Primary CTA, active tabs, links, active sport pills |
| `blue-light` | `#dbeafe` | Blue chip backgrounds, today-button fill |
| `page-bg` | `#f1f5f9` | Page background (light slate) |
| `card-bg` | `#ffffff` | All card and modal surfaces |
| `border` | `#e2e8f0` | Default borders and dividers |
| `border-light` | `#f0f4f8` | Table row separators |

### Semantic

| Token | Hex | Use |
|---|---|---|
| `live-red` | `#dc2626` | LIVE badge, pulsing indicator, loss decisions |
| `live-red-bg` | `#fef2f2` | LIVE badge background |
| `win-green` | `#15803d` | Final badge, win decisions, GB leader |
| `win-green-bg` | `#f0fdf4` | Final badge background |
| `runner-orange` | `#f97316` | Runner-on-base highlight (Gamecast diamond) |
| `scheduled-blue` | `#1d4ed8` | Scheduled game badge, inning labels |
| `save-blue` | `#2563eb` | Save decision pill |
| `amber-badge` | `#fbbf24` | "Soon" coming-soon badge background |

### Text

| Token | Hex | Use |
|---|---|---|
| `text-primary` | `#1a202c` | Headings, winner names, scores |
| `text-secondary` | `#2d3748` | Body copy, table cells |
| `text-muted` | `#4a5568` | Supporting labels |
| `text-subtle` | `#718096` | Captions, metadata, placeholder copy |
| `text-faint` | `#a0aec0` | Disabled states, timestamps |

### Count-indicator colors (Gamecast only)

| Indicator | Hex |
|---|---|
| Balls (filled) | `#22c55e` (green) |
| Strikes (filled) | `#facc15` (yellow) |
| Outs (filled) | `#ef4444` (red) |
| Any (empty) | `rgba(255,255,255,0.15)` |

---

## 3. Typography

**Font family:** `Inter, system-ui, Avenir, Helvetica, Arial, sans-serif`

| Role | Size | Weight | Notes |
|---|---|---|---|
| Nav brand | 1.05rem | 800 | White, tight letter-spacing |
| Hero headline | clamp(1rem, 2.5vw, 1.55rem) | 800 | White, text-shadow |
| Section title | 1.4rem | 800 | Dark primary |
| Carousel description | 0.85rem | 400 | White 78% opacity, 2-line clamp |
| Card team name | 0.88rem | 400–700 | 700 when winner |
| Score | 1.05–1.15rem | 800 | Bold when winner |
| Modal score | 2rem | 800 | Muted when losing |
| Table header | 0.82rem | 700 | Uppercase where used as labels |
| Table body | 0.82rem | 400–500 | |
| Badge / pill label | 0.68–0.78rem | 700 | All-caps for LIVE/FINAL, sentence case for time |
| Caption / meta | 0.70–0.75rem | 400–600 | |

---

## 4. Layout & Page Structure

### Breakpoints

| Name | Width |
|---|---|
| Mobile | ≤ 640px |
| Desktop | > 640px |

### Page Skeleton (desktop)

```
┌──────────────────────────────────────────────────────────────────────┐
│  STICKY NAV (full width, navy-deep, h=56px)                         │
│  [⚾ Baseball Dashboard]          [📊 Scores]  [🏆 Standings]  [⭐ Leaders] │
├──────────────────────────────────────────────────────────────────────┤
│  HERO CAROUSEL (full width, height clamp 220–400px)                 │
│  Background image fills, dark gradient overlay bottom 85% → 0%      │
│  ┌───────────────────────────────────────────┐   ● ● ○ ○            │
│  │ [CATEGORY PILL]                            │   dot indicators     │
│  │ Headline text (large, white, bold)         │   bottom-right       │
│  │ Description text (small, white 78%)        │                      │
│  │ [Read more →] CTA button                   │  ‹ prev  next ›      │
│  └───────────────────────────────────────────┘                      │
├──────────────────────────────────────────────────────────────────────┤
│  CONTENT AREA  (max-width 1100px, centered, padding 0 16px)         │
│                                                                      │
│  Sport pills row: [🎓 D1 College]  [🎓 D2/D3 Soon]  [🏟️ MLB]        │
│                                                                      │
│  ── Scores section ──────────────────────────────────────────────── │
│  Date nav: ‹  Wednesday, May 27, 2026  ›  [Back to Today] / LIVE    │
│  Games grid (auto-fill, min 260px cols, 14px gap):                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
│  │ Game Card  │  │ Game Card  │  │ Game Card  │  │ Game Card  │    │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘    │
│                                                                      │
│  ── Standings section ───────────────────────────────────────────── │
│  American League heading (underlined)                               │
│  3-column division grid: [AL East] [AL Central] [AL West]          │
│  National League heading                                            │
│  3-column division grid: [NL East] [NL Central] [NL West]          │
│                                                                      │
│  ── Leaders section ─────────────────────────────────────────────── │
│  Date nav (shared with Scores)                                      │
│  Leaders grid (auto-fill, min 240px):                               │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐       │
│  │ Leader │  │ Leader │  │ Leader │  │ Leader │  │ Leader │       │
│  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. Components

### 5.1 Sticky Navigation Bar

- **Height:** 56px
- **Background:** `#0f172a` (navy-deep) with bottom box-shadow `0 2px 16px rgba(0,0,0,0.45)`
- **Position:** Sticky, `z-index: 200`, always on top
- **Left:** Brand mark — ⚾ Baseball Dashboard — white, 800 weight, slightly tight letter-spacing
- **Right:** Three tab buttons — 📊 Scores, 🏆 Standings, ⭐ Leaders
  - Default: `#94a3b8` text, transparent background
  - Hover: white text, `rgba(255,255,255,0.08)` background, 8px border-radius
  - **Active:** white text, `rgba(255,255,255,0.14)` background
- **Mobile:** Brand shrinks, tabs compress to icon-only or smaller text, horizontally scrollable

---

### 5.2 Hero Carousel

- **Height:** `clamp(220px, 38vw, 400px)` — tall on desktop, shorter on mobile
- **Background:** Each slide is a full-cover background image (`background-size: cover; background-position: center`)
- **Transition:** Slides fade between each other with `opacity` transition (0.7s ease). Only active slide is `opacity: 1`.
- **Gradient overlay:** Fixed over all slides — `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 55%, transparent 100%)` — bottom of image is very dark so text is readable
- **Content (bottom-left, z-index above gradient):**
  - Small pill label: category name (e.g., "College Baseball"), blue `#2563eb` background, white text, 999px border-radius, 0.68rem uppercase bold
  - Headline: large white 800-weight text with light text-shadow
  - Description: 2-line-clamped, 78% white opacity, 0.85rem
  - CTA button: "Read more →", blue `#2563eb` background, white text, 8px border-radius
  - Content animates in with a subtle fade-up (opacity 0→1, translateY 8px→0) when slide changes
- **Prev/Next arrows:** Circular buttons (38×38px), `rgba(0,0,0,0.45)` background, white border with 25% opacity, positioned at center-left and center-right. Darker on hover.
- **Dot indicators:** Bottom-right corner. Small 7px circles. Inactive = `rgba(255,255,255,0.35)`. Active = white, scale 1.35×.
- **Empty state:** Dark navy background showing a large sport emoji, white title, and subtitle

---

### 5.3 Sport Pill Selector

A horizontal row of pill-shaped toggle buttons:

| State | Appearance |
|---|---|
| **Default** | White background, `#cbd5e0` 2px border, `#4a5568` text |
| **Hover** | `#2563eb` border + text |
| **Active** | `#2563eb` filled background, white text |
| **Disabled ("Soon")** | 50% opacity, dashed border, `not-allowed` cursor |

- Pills have 999px border-radius (fully rounded)
- "D2/D3" pill shows an amber `#fbbf24` "Soon" micro-badge inside it
- Emoji prefix (🎓 for college, 🏟️ for MLB)
- Gap: 8px between pills

---

### 5.4 Date Navigator

A centered row:
- **Left/Right arrows:** 44×44px circular white buttons with `#cbd5e0` 2px border. Show `‹` and `›` chevrons at 1.6rem.
- **Center:** Date label (1.05rem, 600 weight) and below it, one of:
  - **"Back to Today"** pill-button: blue text `#2563eb`, light blue `#dbeafe` background, `#93c5fd` 1px border
  - **"N games live"** pill: red `#dc2626` background, white text, pulsing opacity animation (2s loop)
  - Nothing (if today and no live games)

---

### 5.5 Game Card

Clickable button-reset card. On a white background with 14px border-radius.

**Default state:**
- 1px `#e2e8f0` border
- Subtle box-shadow `0 1px 4px rgba(0,0,0,0.06)`
- Padding 14px 16px 10px

**Live state (game in progress):**
- `#fca5a5` border (red-ish)
- Double-ring glow: `0 0 0 2px #fecaca, 0 4px 14px rgba(220,38,38,0.12)`

**Hover:** Lifts up 1px with deeper shadow.

**Card anatomy (top to bottom):**
1. **Status row:** Badge pill + inning text
   - `● LIVE` — red `#dc2626` text, `#fef2f2` background — animated pulse
   - `Final` — green `#15803d` text, `#f0fdf4` background
   - Time (e.g., "7:05 PM ET") — blue `#1d4ed8` text, `#eff6ff` background, sentence case
2. **Away team row:** 28×28px logo · team name · score (right-aligned)
3. **Home team row:** same structure
   - Winner team name is **700 weight, `#1a202c`** (darker)
   - Winner score is **800 weight, 1.15rem**
   - Loser score is muted gray
4. **"View details →"** caption: right-aligned, 0.75rem, `#2563eb`, 80% opacity

---

### 5.6 Game Details Modal

Full-screen overlay (`rgba(0,0,0,0.55)` backdrop), with a centered card (`max-width: 760px`, `max-height: 90vh`, `border-radius: 18px`, `box-shadow: 0 24px 64px rgba(0,0,0,0.25)`). Enters with fade + slide-up animation.

#### Modal Header

- Background uses a **team-color gradient**: `linear-gradient(135deg, {awayTeamColor}18 0%, #f8fafc 45%, {homeTeamColor}18 100%)`
  - This subtly tints the header with each team's identity color
- Layout: `[Away team] · [Score] ··· [Status center] ··· [Score] · [Home team]`
  - **Away side (left):** 4px left border in away team color, team logo (42×42px), team name, "Away" sublabel
  - **Center:** "vs" (scheduled), animated `● LIVE` badge (in-progress), or "Final" in green (completed)
  - **Home side (right):** mirror of away, 4px right border in home team color
  - Winning team score is **bold and in their team color**; losing team score is muted gray
- **Close button (✕):** Top-right, 30×30px circle, `#e2e8f0` background

#### Modal Tabs

Horizontal tab bar with 1px bottom border separator:
- Default tab: `#718096` text
- Hover: `#2563eb`
- **Active:** text and 2px bottom border take on the **current team's color** (dynamic, inline styled)
- Tabs: **🔴 Gamecast** (live only) · **Box Score** · **Scoring Summary** · **Highlights** (if available)

#### Tab — 🔴 Gamecast (Live games only)

See **Section 5.7 — Live Baseball Diamond** below.

#### Tab — Box Score

1. **Line Score table** — scrollable horizontally
   - Row for each team, left cell has a colored left-border in team color
   - Columns: team abbr · inning 1 through N · R · H · E
   - R/H/E columns have `#edf2f7` slightly highlighted background headers
2. **Team selector buttons** — away | home
   - Active button: border and text take on that team's primary color, faint colored fill
3. **Batting table** per team:
   - Columns: # (batting order) · Pos · Batter · AB · R · H · RBI · HR · BB · K · AVG
   - Substitution rows: slightly indented name, italic, muted gray text, `#fafbfc` row background
   - Batting order number colored in team's primary color
   - Totals row: bold, `#f7fafc` background, `2px solid #e2e8f0` top border
4. **Pitching table** per team:
   - Columns: Pitcher · IP · H · R · ER · BB · K · HR · ERA
   - Inline decision badge next to pitcher name: **W** (green), **L** (red), **S** (blue)
5. **Game Notes section** (below tables, separated by 2px divider):
   - **Extra Base Hits block:** Team abbreviation pill (dark background, white text) + chips for 2B/3B/HR with blue bold label
   - **Errors block:** Same structure
   - **Pitching Decisions block:** Win pill (green tinted border/bg), Loss pill (red), Save pill (blue)

#### Tab — Scoring Summary

Vertical list of scoring plays. Each play is a card (`#f8fafc` background, `#e2e8f0` border, 10px radius):
- Meta row: inning pill (blue on blue-50) · team logo + abbreviation · score at that moment (right-aligned)
- Description text below in `#4a5568`

#### Tab — Highlights

Grid of video thumbnails (`auto-fill, minmax 220px`). Each card:
- 16:9 thumbnail image
- White ▶ play button centered overlay
- Headline text below in a white bar
- Hover: lifts up, image dims slightly

---

### 5.7 Live Baseball Diamond (Gamecast Tab)

Dark-themed panel (`#0f172a` background, 12px border-radius).

**Top bar:**
- Inning indicator: "▲ 5" or "▼ 7" (triangle for top/bottom) in white 800-weight
- Animated `● LIVE` in red, pulsing

**Main body — two columns:**

**Left: SVG Baseball Field (300×270 viewBox)**

Drawn top-down (bird's-eye view, home plate at bottom):

- **Background:** Dark green `#1e5c1e`, 8px radius
- **Foul lines:** Faint white diagonal lines from home plate to upper corners (25% opacity)
- **Dirt infield polygon:** Light tan `#c8a47a` diamond shape connecting all four bases
- **Infield grass square:** Slightly smaller `#2d7a2d` green square inside the dirt, creating contrast
- **Pitcher's mound:** Tan circle (r=12) at center of diamond, white 35% stroke
- **Base paths:** White 1.5px lines connecting the four bases (70% opacity)
- **Bases:**
  - Each base is a rotated 45° square (diamond shape), 16×16px
  - **Empty:** `rgba(200,180,150,0.45)` — faded tan
  - **Runner on base:** `#f97316` (orange) with a glow `drop-shadow(0 0 5px #f97316aa)`
  - Home plate: white pentagon shape
- **Batter's boxes:** Two faint rectangular outlines beside home plate (left and right)
- **Fielder markers:** For each of 9 positions (P, C, 1B, 2B, SS, 3B, LF, CF, RF):
  - Drop shadow circle offset 1px
  - Filled circle: `rgba(15,40,100,0.82)` (deep blue), white 1.5px stroke
  - Position abbreviation inside (9px bold white)
  - Player's short name as tiny label above (or below for CF near top edge), 7.2px white 90% opacity, truncated to 9 chars

**Right: Live Info Panel**

Three stacked cards (dark translucent background `rgba(255,255,255,0.07)`, 10px radius):

1. **Count display:**
   - Row for each: `B` (Balls), `S` (Strikes), `O` (Outs)
   - Each row: small label + SVG row of filled/empty dots
     - Balls: up to 4 dots, filled = `#22c55e` (green)
     - Strikes: up to 3 dots, filled = `#facc15` (yellow)
     - Outs: up to 3 dots, filled = `#ef4444` (red)
     - Empty dots: `rgba(255,255,255,0.15)`
2. **Runner pills:** Three pill buttons — 1B, 2B, 3B
   - Empty: faint border, muted text
   - **Occupied:** Orange fill `#f97316`, white text, orange glow
3. **Matchup display:**
   - 🏏 BAT badge (blue-tinted) + batter's name (white bold)
   - ⚾ PIT badge (green-tinted) + pitcher's name (white bold)

**Mobile:** Field and info panel stack vertically.

---

### 5.8 MLB Standings

Two sections: **American League** and **National League**, each with an underlined heading.

Each section contains a **grid of 3 division cards** (responsive: 1 column on mobile).

**Division card:**
- 14px border-radius, white background, subtle shadow
- **Header bar:** `#1e3a5f` navy background, white uppercase label (e.g., "East"), 800 weight, small font
- **Table inside:**
  - Columns: Team · W · L · PCT · GB · Home · Away · L10 · Str
  - Home/Away/L10 hidden on mobile
  - Team cell: 22×22px logo + team name
  - **Division leader row:** All cells bold
  - GB leader: `—` shown in green `#15803d`, 800 weight
  - Streak: "W3" in green, "L2" in red
  - Row hover: faint `#f8fafc` background

---

### 5.9 College Baseball Top 25 Rankings

Displayed instead of standings when College sport is selected.

A **vertical list** of ranking rows, each:
- White card, `#e2e8f0` 1px border, 10px radius
- **Left accent border: 4px solid in the team's primary color**
- Contents: Rank number (large, bold, muted) · 30×30px team logo · Team name (bold) · Abbreviation (subtle) · Record (right-aligned, bold)
- Hover: lifts 1px, shadow deepens

---

### 5.10 Top Performers (Leaders) Cards

Auto-fill grid of cards (`minmax 240px`), each card:

**Card header (gradient background from team color):**
- Background: `linear-gradient(135deg, {teamColor}18, {teamColor}06)`
- Bottom border: `2px solid {teamColor}25`
- **Headshot:** 58×58px circle, `object-fit: cover`, centered from top of image, with a colored ring `box-shadow: 0 0 0 3px {teamColor}40`
- **Info block:**
  - Player short name — 0.93rem, 800 weight
  - Row: small team logo (16px) + team abbreviation in team color + position pill (gray background)
  - Matchup caption (tiny, muted, ellipsed)

**Card stat bar** (bottom, `#fafbff` background, 1px top border):
- Stat line text: e.g., "3-4, HR, 2 RBI, 2 R, BB, SB, K"
- 0.81rem, 600 weight, `#2d3748`

**Card hover:** Lifts 2px with deeper shadow.

---

## 6. Motion & Interaction

| Element | Animation |
|---|---|
| Hero carousel slide | `opacity` crossfade, 0.7s ease |
| Hero carousel text | Fade-up: `opacity 0→1, translateY 8px→0`, 0.4s ease, triggers on slide change |
| Modal enter | Backdrop: `opacity 0→1` (0.15s); Modal: `translateY(20px)→0 + opacity 0→1` (0.2s ease) |
| LIVE badge | Opacity pulse: `1→0.65→1`, 2s infinite |
| Live count badge | Same pulse on the game list |
| Card hover | `translateY(-1px)` + box-shadow deepens, 0.1–0.15s |
| Leader card hover | `translateY(-2px)` + shadow deepens |
| Ranking row hover | `translateY(-1px)` |
| Highlight card hover | `translateY(-2px)` + image opacity 1→0.85 |
| Carousel dot active | `transform: scale(1.35)`, 0.2s |
| Runner pill active | Orange fill + `box-shadow: 0 0 8px rgba(249,115,22,0.5)` |
| Spinner | `rotate(360deg)`, 0.7s linear infinite |

---

## 7. Screen Designs to Produce

Please produce high-fidelity desktop and mobile mockups for each of these views:

### Screen 1 — Scores (Default landing)
- Sticky nav (Scores tab active)
- Hero carousel showing a baseball news article image
- Sport pills (D1 College active)
- Date navigator
- Game card grid — show a mix of states:
  - 2 live games (red glow border, ● LIVE badge, inning)
  - 3 final games
  - 2 scheduled games (showing time)

### Screen 2 — Game Details Modal (Final game, Box Score tab)
- Modal overlaid on Scores page (blurred/dimmed backdrop)
- Modal header: away team left / score / status center / home team right with team-color gradient tinting
- Box Score tab active (underlined in team color)
- Line score table at top
- Team selector buttons below
- Batting table with order numbers, positions, and one substitution row (indented, italic)
- Pitching table with W decision badge on winning pitcher
- Game notes section: Extra Base Hits + Errors + Pitching decisions (W/L/SV pills)

### Screen 3 — Game Details Modal (Live game, Gamecast tab)
- Modal header with both team scores and ● LIVE badge center
- 🔴 Gamecast tab active
- Full live diamond panel:
  - SVG field with one runner on 2nd base (orange), pitcher and all fielders shown with names
  - Count: 2 balls (2 green dots), 1 strike (1 yellow dot), 1 out (1 red dot)
  - Runner pills: 2B lit up orange, 1B and 3B dim
  - Matchup showing batter name and pitcher name

### Screen 4 — MLB Standings
- Nav (Standings tab active)
- Hero carousel (smaller, same)
- MLB sport pill active
- American League section with 3 division cards in a row
- National League section below
- Show one team as division leader (bolded row) in each division

### Screen 5 — College Top 25 Rankings
- Nav (Standings active), D1 College sport pill
- Ranking list: first 10 entries visible
- Team color accent borders vary per team (UCLA blue, Georgia red, UNC navy, etc.)
- Team logos visible

### Screen 6 — Leaders (Top Performers)
- Nav (Leaders tab active)
- Date navigator
- Grid of 8–12 player cards
- Show variety: headshots with team-colored rings, stat lines, different team logos
- One card in hover state (lifted)

### Screen 7 — Mobile: Scores
- Nav collapsed (smaller text)
- Carousel at 220px height, no description visible
- Single-column game cards
- Pills slightly smaller

### Screen 8 — Mobile: Live Gamecast Modal
- Modal near full-screen
- Diamond SVG stacked above info panel (full width)
- Count dots and runner pills in a row below the field
- Batter/Pitcher matchup below

---

## 8. Design Notes & Constraints

- **Team colors are dynamic** — pulled from ESPN API at runtime. The design uses them as accent colors for borders, card backgrounds (at ~8–15% opacity), score text, and active states. Show at least 3 different team color examples in mockups.
- **No auth screens** — the app is fully public. No login, no onboarding.
- **D2/D3 pill** should look clearly "coming soon" — dashed border, reduced opacity, amber "Soon" badge. Do not make it look broken.
- **Data density** — the box score tab is intentionally data-dense (many columns). Keep font sizes small but readable (0.82rem table text is acceptable).
- **Accessibility** — ensure sufficient contrast. Muted text on white cards must still be legible.
- **No sidebar** — layout is single-column content with internal grid. No persistent sidebar.
- **The carousel gradient** is critical — without the bottom-to-transparent dark gradient, the text overlay is unreadable. This must be present over all carousel images.
- **Gamecast dark theme** is isolated — only the Gamecast panel (and the sticky nav) use dark backgrounds. The rest of the app is light.

---

## 9. Assets & Icons

- **Team logos:** Served as PNG images from ESPN CDN (square, transparent background). Displayed at 16–42px depending on context.
- **Player headshots:** PNG from ESPN CDN, `object-position: top` to show face.
- **Icons used:** All emoji — ⚾ ⭐ 📊 🏆 🎓 🏟️ 🏏 ▶ ▲ ▼ ● ‹ ›
- **No icon library required.** All indicators are CSS shapes or Unicode characters.

---

*Generated from the live codebase of College-Baseball-Dashboard (React + TypeScript + Vite, ESPN public API). The implementation uses inline SVG for the live field, CSS animations for all transitions, and dynamic team colors injected via inline styles.*