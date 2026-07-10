# ⚾ Baseball Dashboard

### 🔗 [Live site → college-baseball-dashboard.vercel.app](https://college-baseball-dashboard.vercel.app)

A live college baseball and MLB score-tracking dashboard built with React, TypeScript, and Vite. Think ESPN GameCenter meets a clean, dark sports-media aesthetic — data-dense but visually approachable, with bold use of team colors and smooth animations.

Live data is pulled from ESPN's public API. No backend or API key required.

> **Status:** Live and deployed on Vercel. Run locally with `npm run dev` — setup takes under 2 minutes.

---

## Features

### Scores
- Live, final, and scheduled game cards for any date
- Date navigator to browse past and future games
- Live game cards pulse with a red glow border and animated LIVE badge
- Click any game card to open a full game details modal

### Game Details Modal
- **Gamecast** (live games only) — animated baseball diamond showing all 9 fielders with names, base runners highlighted in orange, and a real-time BSO (balls/strikes/outs) indicator
- Pitcher vs. batter matchup cards with player headshots and in-game stat lines
- This-inning play-by-play feed showing the latest plays
- **Box Score** — line score by inning, full batting and pitching tables, game notes (extra base hits, errors, pitching decisions)
- **Scoring Summary** — chronological list of all scoring plays
- **Highlights** — video thumbnail grid (when available)

### Standings
- MLB: full American and National League standings split by division, with W/L/PCT/GB/Home/Away/L10/Streak
- College: D1Baseball Top 25 weekly rankings with team color accents

### Leaders
- Top performers grid for any date, pulled from ESPN game leaders
- Player headshots, team logos, stat lines, and matchup context

### Navigation
- Sport selector (MLB / D1 College) in the sticky top navbar — MLB is the default landing page
- Section selector (Scores / Standings / Leaders) below the hero carousel
- Framer Motion page transitions and card animations throughout

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS + custom CSS (design tokens in `tokens.ts`) |
| Animations | Framer Motion |
| Deployment | Vercel |
| Backend (planned) | AWS Amplify — Cognito auth + Bedrock (Claude) API, scaffolded but not yet wired into the app |
| Data source | ESPN public API (no key required) |
| Fonts | Space Mono, JetBrains Mono (Google Fonts) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install dependencies

```bash
npm install
```

### Configure environment variables

```bash
cp .env.example .env.local
```

The defaults point at ESPN's public API and work out of the box — no keys required.

### Run the dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

---

## Deployment

The app is hosted on [Vercel](https://vercel.com), connected to this repo — pushes to `main` deploy automatically.

The `amplify/` directory is a separate, not-yet-connected AWS Amplify backend (Cognito email auth + a Bedrock-backed `askBedrock` query). It's reserved for a future user-login feature and isn't used by the current UI or the Vercel deployment.

---

## Data Sources

All data is fetched client-side from ESPN's public API endpoints:

| Endpoint | Used for |
|---|---|
| `/apis/site/v2/sports/baseball/{sport}/scoreboard` | Game scores, leaders |
| `/apis/site/v2/sports/baseball/{sport}/summary?event={id}` | Box score, live situation, play-by-play, highlights |
| `/apis/site/v2/sports/baseball/mlb/standings` | MLB standings |
| `/apis/site/v2/sports/baseball/{sport}/news` | Hero carousel articles |
| `a.espncdn.com/i/headshots/{sport}/players/full/{id}.png` | Player headshots |

Sport values are `mlb` and `college-baseball`.

---

## Project Structure

```
src/
  App.tsx        — All components and API logic (single-file architecture)
  App.css        — All styles
  tokens.ts      — Design token constants
  main.tsx       — React entry point
amplify/         — AWS Amplify backend (Cognito auth + Bedrock query), planned for future login feature
dist/            — Production build output
```

---

## Roadmap

- [ ] User login (Cognito auth already scaffolded in `amplify/`, not yet wired up)
- [ ] D2/D3 college baseball scores (requires backend proxy — no public API available)
- [ ] Push notifications for live game score changes
- [ ] Favorite teams / personalized feed (depends on user login)
- [ ] Historical game search
- [ ] AI-assisted features via the scaffolded Bedrock (Claude) query

---

## License

ISC