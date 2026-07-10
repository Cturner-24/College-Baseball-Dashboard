// ─────────────────────────────────────────────────────────────────────────────
// App.tsx  —  Baseball Dashboard
//
// This is the entire application in one file. It's written in TypeScript (a
// version of JavaScript with types) using React, a library that lets you build
// UIs out of reusable "components" — functions that return HTML-like markup.
//
// Reading guide:
//   1. Imports & animation config  (~line 1)
//   2. TypeScript type definitions  (~line 43)
//   3. Helper utilities             (~line 113)
//   4. ESPN API fetch functions     (~line 131)
//   5. UI components                (~line 583)
//   6. Root App component           (~line 1460)
// ─────────────────────────────────────────────────────────────────────────────

// React hooks — these are built-in functions React gives us to manage state
// and side effects inside components:
//   useState    — stores a value that can change; re-renders the component when it does
//   useEffect   — runs code after the component renders (great for fetching data)
//   useCallback — memoizes a function so it isn't re-created on every render
//   useRef      — holds a reference to a DOM element without causing re-renders
import { useState, useEffect, useCallback, useRef } from "react";
import type { CSSProperties } from "react";

// Framer Motion — an animation library for React.
//   motion      — a wrapper that adds animation props (initial, animate, exit) to any HTML element
//   AnimatePresence — lets components animate OUT when they're removed from the page
//   useReducedMotion — returns true if the user has "reduce motion" enabled in their OS
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// Phosphor Icons — a consistent SVG icon set. Each icon is a React component
// that renders crisp vector graphics (unlike emojis, which vary per platform).
import {
  Baseball,        // Brand mark + generic baseball placeholder
  GraduationCap,   // College sport tab
  BaseballCap,     // MLB sport tab
  SquaresFour,     // Scores section
  Trophy,          // Standings section
  Star,            // Leaders section
  CaretLeft,       // Prev arrows (carousel, date nav)
  CaretRight,      // Next arrows
  X,               // Modal close
  Play,            // Highlight video overlay
  User,            // Player headshot placeholder
  Clock,           // "Game hasn't started" notice
} from "@phosphor-icons/react";

// Import all the CSS styles for this app from App.css
import "./App.css";

// ─── Animation variants ───────────────────────────────────────────────────────
// Framer Motion uses "variant" objects to describe animation states.
// Each variant has a "hidden" state (starting/exiting) and a "visible" state (end position).

// Cards blur and slide up when they enter the page
const blurSlideUp = {
  hidden:  { opacity: 0, filter: "blur(12px)", y: 28 },
  visible: { opacity: 1, filter: "blur(0px)",  y: 0,
             transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

// Simplified version for users who prefer reduced motion (accessibility)
const blurSlideUpReduced = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7 } },
};

// When a grid of cards renders, this staggers each child's animation by 0.09s
// so they cascade in one by one rather than all at once
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

// Applied on hover — cards spring upward slightly
const cardHover = {
  y: -7, scale: 1.018,
  transition: { type: "spring" as const, stiffness: 300, damping: 22 },
};

// Custom hook: returns the right animation variant based on the user's OS setting.
// A "hook" is just a function that starts with "use" and can call other hooks.
function useBlurSlideUp() {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? blurSlideUpReduced : blurSlideUp;
}

// ─── Types ────────────────────────────────────────────────────────────────────
// TypeScript "types" and "interfaces" describe the shape of data — what fields
// an object has and what type each field is. This prevents bugs and gives you
// autocomplete in your editor.
//
// Think of an interface like a form: it lists every field the form has.
// If you try to use a field that isn't listed, TypeScript throws an error.

// The two sports the app supports
type Sport = "college-baseball" | "mlb";

// The three main sections of the dashboard
type Section = "scores" | "standings" | "leaders";

// Describes one team within a game (used for both home and away)
interface Team {
  name: string;         // Full team name e.g. "Los Angeles Dodgers"
  abbreviation: string; // Short code e.g. "LAD"
  score: string;        // Current score as a string (ESPN returns it this way)
  logo: string;         // URL to the team's logo image
  winner: boolean;      // True if this team won (used to bold the winning score)
  color: string;        // Team primary hex color WITHOUT the # (used for accent edges)
}

// Describes a single game as returned by the scoreboard API
interface Game {
  id: string;           // ESPN's unique ID for this game event
  home: Team;
  away: Team;
  status: string;       // Machine-readable status e.g. "STATUS_IN_PROGRESS"
  statusDetail: string; // Human-readable e.g. "Bot 7th", "Final", "7:05 PM ET"
}

// The inning-by-inning score grid shown in the box score tab
interface LineScoreData {
  headers: string[];                            // ["", "1", "2", ... "R", "H", "E"]
  rows: { abbr: string; cells: string[] }[];    // One row per team
  rheStart: number;                             // Column index where R/H/E totals begin
}

// One row in a batting or pitching table (represents one player)
interface PlayerRow {
  name: string;       // Player's short name
  stats: string[];    // Array of stat values matching the table headers
  note?: string;      // Optional pitching decision text e.g. "W (3-1)"
  batOrder?: number;  // Batting order position (1–9), used to group substitutions
  position?: string;  // Field position e.g. "CF", "1B", "SP"
  isSub?: boolean;    // True if this player entered as a substitution
}

// A group of player rows — either a full batting lineup or pitching staff
interface StatGroup {
  type: "batting" | "pitching";
  headers: string[];    // Column labels for the table
  rows: PlayerRow[];
  totals?: string[];    // Team totals row at the bottom (batting only)
}

// Complete box score data for one team
interface TeamBoxScore {
  name: string;         // Full team name
  abbr: string;         // Abbreviation
  logo: string;         // Logo URL
  color: string;        // Primary hex color (without the #)
  altColor: string;     // Alternate hex color
  statGroups: StatGroup[]; // Batting and pitching tables
}

// Extra base hits and errors shown in the "Game Notes" section
interface TeamNotes {
  teamAbbr: string;
  doubles: string;   // e.g. "Smith, Jones"
  triples: string;
  homeRuns: string;
  errors: string;
}

// Win/loss/save decisions for the box score footer
interface PitchingDecision { winner?: string; loser?: string; save?: string; }

// One entry in the Scoring Summary tab — a play where runs scored
interface ScoringPlay {
  inningLabel: string; // e.g. "Top 3"
  teamAbbr: string;    // The team that scored
  teamLogo: string;
  description: string; // Play text e.g. "Smith homers on a fly ball to left field"
  awayScore: number;   // Score after this play
  homeScore: number;
  awayAbbr: string;    // Used to label the scoreline
  homeAbbr: string;
}

// One video highlight card
interface Highlight { id: string; headline: string; thumbnail: string; href: string; }

// Everything loaded for the game details modal
interface GameDetails {
  lineScore: LineScoreData | null;        // null if game hasn't started
  teams: [TeamBoxScore, TeamBoxScore];    // [away, home]
  scoringPlays: ScoringPlay[];
  teamNotes: [TeamNotes, TeamNotes];      // [away, home]
  pitchingDecision: PitchingDecision;
  highlights: Highlight[];
}

// A news article for the hero carousel
interface NewsItem {
  id: string;
  headline: string;
  description: string;
  imageUrl: string;   // Background image for the carousel slide
  href: string;       // Link to the full article
  category: string;   // e.g. "College Baseball"
}

// One team row in the MLB standings table
interface StandingsEntry {
  abbr: string; name: string; logo: string;
  wins: string; losses: string; pct: string; gb: string; // GB = games behind leader
  home: string; away: string; streak: string; l10: string; // L10 = last 10 games record
}

// A division within a league e.g. "American League East"
interface StandingsGroup { league: string; division: string; entries: StandingsEntry[]; }

// One team in the D1Baseball Top 25 rankings list
interface RankingEntry { rank: number; abbr: string; name: string; logo: string; color: string; record: string; }

// A player card shown in the Leaders/Top Performers section
interface Performer {
  id: string;
  name: string;
  shortName: string;   // Abbreviated e.g. "M. Trout"
  headshot: string;    // URL to player photo
  position: string;    // e.g. "CF", "SP"
  teamAbbr: string;
  teamLogo: string;
  teamColor: string;   // Hex color without #
  statLine: string;    // e.g. "3-4, HR, 2 RBI"
  rating: number;      // Numeric value ESPN uses to rank leaders
  matchup: string;     // e.g. "LAD vs SF"
}

// Position of one fielder on the live diamond
interface LiveFielder { pos: string; name: string; }

// Everything needed to render the live Gamecast view
interface LiveSituation {
  balls: number;        // Current count (0–3)
  strikes: number;      // Current count (0–2)
  outs: number;         // Current count (0–2)
  onFirst: boolean;     // Is there a runner on first base?
  onSecond: boolean;
  onThird: boolean;
  batterName: string;   // Current batter's short name
  pitcherName: string;  // Current pitcher's short name
  inningLabel: string;  // e.g. "▲ 5" or "▼ 7"
  fielders: LiveFielder[]; // All 9 fielders and their positions
  batterHeadshot: string;  // URL to batter's photo
  pitcherHeadshot: string;
  batterGameLine: string;  // e.g. "2-3, 1 HR, 2 RBI"
  pitcherGameLine: string; // e.g. "6.0 IP, 3 H, 1 ER, 7 K, 1 BB"
  latestPlay: string;      // Text description of the most recent play
  inningPlays: string[];   // Up to 5 plays from the current inning
}

// ─── Constants ────────────────────────────────────────────────────────────────

// The stat columns we display in the batting table (ESPN returns many more, we filter to these)
const BATTING_COLS  = ["AB","R","H","RBI","HR","BB","K","AVG"];

// The stat columns we display in the pitching table
const PITCHING_COLS = ["IP","H","R","ER","BB","K","HR","ERA"];

// Used when building the standings API URL so we always fetch the current season
const CURRENT_YEAR  = new Date().getFullYear();

// The three dashboard sections with their icons — rendered as pills on desktop
// and as the fixed bottom navigation bar on mobile.
const SECTION_ITEMS = [
  { id: "scores"    as Section, label: "Scores",    icon: SquaresFour },
  { id: "standings" as Section, label: "Standings", icon: Trophy },
  { id: "leaders"   as Section, label: "Leaders",   icon: Star },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Small utility functions used throughout the app.

// ESPN's scoreboard API expects dates formatted as "YYYYMMDD" with no separators
// padStart(2, "0") ensures single-digit months/days get a leading zero: 5 → "05"
function toESPNDate(d: Date) {
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
}

// Formats a Date into a long readable string e.g. "Wednesday, June 1, 2026"
function formatDisplayDate(d: Date) {
  return d.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
}

// Returns true if the given date is today (compares string representations to ignore time)
function isToday(d: Date) { return d.toDateString() === new Date().toDateString(); }

// Returns a new Date shifted by `delta` days (positive = forward, negative = backward)
function shiftDay(d: Date, delta: number) { const n=new Date(d); n.setDate(n.getDate()+delta); return n; }

// Converts an ESPN team color (stored as a hex string without #) to a full CSS color.
// Falls back to blue if the color is missing.
function teamHex(color: string, fallback="2563eb") { return color ? `#${color}` : `#${fallback}`; }

// ─── ESPN API ─────────────────────────────────────────────────────────────────
// These are all "async" functions — they make network requests and wait for a
// response. The "await" keyword pauses the function until the data arrives.
// The "Promise<X>" return type means "this function will eventually return X."

// Fetches the scoreboard for a given sport and date.
// Returns an array of Game objects — one per game that day.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchGames(sport: Sport, date: Date): Promise<Game[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/${sport}/scoreboard?dates=${toESPNDate(date)}`;
  const res = await fetch(url); // fetch() is a browser built-in for making HTTP requests
  if (!res.ok) throw new Error(`ESPN ${res.status}`); // throw stops execution if the request failed
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json(); // Parse the response body from JSON text into a JS object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.events ?? []).map((event: any): Game => {
    // ?? is "nullish coalescing" — uses the right side if the left is null or undefined
    // .map() transforms every item in an array into something else
    const comp = event.competitions[0]; // ESPN wraps each game in a "competition" array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapSide = (side: "home"|"away"): Team => {
      // .find() searches an array and returns the first matching item
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = comp.competitors.find((x: any) => x.homeAway === side);
      return { name: c.team.displayName??c.team.name, abbreviation: c.team.abbreviation??"",
               score: c.score??"", logo: c.team.logo??"", winner: c.winner??false,
               color: c.team.color??"" };
    };
    return { id: event.id, home: mapSide("home"), away: mapSide("away"),
             status: comp.status.type.name,
             statusDetail: comp.status.type.shortDetail??comp.status.type.detail??comp.status.type.description };
  });
}

// ESPN's news API only returns small (~600px wide) thumbnails, which look blurry
// stretched across the full-width hero carousel. The espncdn.com "combiner"
// endpoint can re-render the same source photo at any size, so we rewrite the
// thumbnail URL into a 1600px-wide request. Non-ESPN or unparseable URLs are
// returned unchanged.
function toHighResImageUrl(url: string): string {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("espncdn.com")) return url;
    // If it's already a combiner URL, keep its img path; otherwise use the pathname
    const imgPath = u.pathname.startsWith("/combiner/i")
      ? (u.searchParams.get("img") ?? u.pathname)
      : u.pathname;
    return `https://a.espncdn.com/combiner/i?img=${imgPath}&w=1600&h=900`;
  } catch {
    return url;
  }
}

// Fetches the latest baseball news articles for the hero carousel.
// Returns up to 8 articles that have images. Wrapped in try/catch so a failure
// just returns an empty array rather than crashing the app.
async function fetchNews(sport: Sport): Promise<NewsItem[]> {
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/baseball/${sport}/news?limit=10`);
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.articles ?? [])
      .filter((a: any) => a.images?.[0]?.url) // Only keep articles that have a photo
      .slice(0,8)                              // Take at most 8
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((a: any) => ({
        id: String(a.dataSourceIdentifier ?? a.id ?? Math.random()),
        headline: a.headline ?? "",
        // Strip any HTML tags from the description text, then trim to 180 characters
        description: (a.description ?? "").replace(/<[^>]*>/g,"").slice(0,180),
        imageUrl: toHighResImageUrl(a.images[0].url),
        href: a.links?.web?.href ?? "",
        category: a.categories?.[0]?.description ?? "",
      }));
  } catch { return []; }
}

// Fetches MLB standings grouped by league and division.
// The ESPN standings API nests data as: season → league → division → team entries.
async function fetchMLBStandings(): Promise<StandingsGroup[]> {
  try {
    const res = await fetch(
      // seasontype=2 means regular season; type=0 and level=3 give full division breakdown
      `https://site.api.espn.com/apis/v2/sports/baseball/mlb/standings?season=${CURRENT_YEAR}&seasontype=2&type=0&level=3`
    );
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    const groups: StandingsGroup[] = [];
    // Outer loop = leagues (American / National)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const league of data.children ?? []) {
      // Inner loop = divisions (East / Central / West)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const div of league.children ?? []) {
        // Map the raw stats array into a lookup object: { "wins": "34", "losses": "19", ... }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entries: StandingsEntry[] = (div.standings?.entries ?? []).map((e: any) => {
          const t = e.team;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sm: Record<string,string> = Object.fromEntries(e.stats.map((s: any)=>[s.name, s.displayValue??""]));
          return { abbr: t.abbreviation??"", name: t.displayName??t.name??"",
                   logo: t.logos?.[0]?.href??"", wins: sm.wins??"", losses: sm.losses??"",
                   pct: sm.winPercent??"", gb: sm.gamesBehind??"", home: sm.Home??"",
                   away: sm.Road??"", streak: sm.streak??"", l10: sm["Last Ten Games"]??"" };
        });
        groups.push({ league: league.name, division: div.name, entries });
      }
    }
    return groups;
  } catch { return []; }
}

// Fetches the current D1Baseball Top 25 college baseball rankings.
// The API returns multiple poll types; we take the first one (index [0]).
async function fetchCollegeRankings(): Promise<RankingEntry[]> {
  try {
    const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/rankings");
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    const poll = (data.rankings ?? [])[0]; // First poll in the list
    if (!poll) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (poll.ranks ?? []).slice(0,25).map((r: any) => {
      const t = r.team ?? {};
      // Build team name from parts in case displayName is missing
      return { rank: r.current??0, abbr: t.abbreviation??"",
               name: t.displayName || (`${t.location ?? ""} ${t.name ?? ""}`).trim() || (t.abbreviation ?? ""),
               logo: t.logos?.[0]?.href??"", color: t.color??"", record: r.recordSummary??"" };
    });
  } catch { return []; }
}

// Fetches the top statistical performers for a given date.
// Reuses the scoreboard endpoint because ESPN embeds "leaders" inside each game.
// We collect up to 12 unique players sorted by their stat rating.
async function fetchTopPerformers(sport: Sport, date: Date): Promise<Performer[]> {
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/baseball/${sport}/scoreboard?dates=${toESPNDate(date)}`
    );
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    const performers: Performer[] = [];
    const seen = new Set<string>(); // Tracks athlete IDs we've already added (avoids duplicates)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const event of data.events ?? []) {
      const comp = event.competitions?.[0];
      if (!comp) continue; // Skip if no competition data
      // Build a lookup map from team ID → team data so we can find a player's team quickly
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const teamById = new Map<string,any>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const c of comp.competitors ?? []) teamById.set(String(c.team?.id??""), c.team??{});
      const matchup = event.shortName ?? ""; // e.g. "LAD @ SF"
      // Each "category" is a stat type (e.g. batting average, home runs)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const cat of comp.leaders ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const l of cat.leaders ?? []) {
          const athlete = l.athlete;
          if (!athlete) continue;
          const id = String(athlete.id);
          if (seen.has(id)) continue; // Don't add the same player twice
          seen.add(id);
          const team = teamById.get(String(athlete.team?.id??"")) ?? {};
          performers.push({
            id, name: athlete.displayName??"", shortName: athlete.shortName??athlete.displayName??"",
            headshot: athlete.headshot??"", position: athlete.position?.abbreviation??"",
            teamAbbr: team.abbreviation??"", teamLogo: team.logo??"", teamColor: team.color??"",
            statLine: l.displayValue??"", rating: l.value??0, matchup,
          });
        }
      }
    }
    // Sort highest rating first, then take just the top 12
    return performers.sort((a,b) => b.rating - a.rating).slice(0,12);
  } catch { return []; }
}

// Fetches everything needed for the live Gamecast view.
// Called once immediately when a live game modal opens, then again every 20 seconds.
// Returns null if the fetch fails (the UI shows a loading spinner in that case).
async function fetchLiveSituation(sport: Sport, eventId: string): Promise<LiveSituation | null> {
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/baseball/${sport}/summary?event=${eventId}`);
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    // "situation" holds the current count, batter, pitcher, etc.
    const sit = data.situation ?? {};

    // ── Build player lookup maps ────────────────────────────────────────────
    // The ESPN summary API can return headshots as either a plain URL string
    // OR as an object { href: "...", alt: "..." } — this helper handles both.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toHsUrl = (raw: any): string => {
      if (!raw) return "";
      if (typeof raw === "string") return raw; // Already a URL — use it directly
      return raw.href ?? raw.url ?? "";        // It's an object — extract the URL from it
    };

    // Maps athlete ID → short name (e.g. "3115338" → "M. Trout")
    const athleteById = new Map<string, string>();
    // Maps athlete ID → headshot URL
    const headshotById = new Map<string, string>();
    // The nine fielders currently on the field
    const fielders: LiveFielder[] = [];

    // Loop through the roster data for both teams
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const roster of data.rosters ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const entry of roster.roster ?? []) {
        const a = entry.athlete ?? {};
        const id = String(a.id ?? "");
        const sn = a.shortName ?? a.displayName ?? "";
        athleteById.set(id, sn);
        const hs = toHsUrl(a.headshot);
        if (hs) headshotById.set(id, hs);
        const pos: string = entry.position?.abbreviation ?? "";
        // Only add players who are actively in the game as starters, and exclude
        // the Designated Hitter (DH) since they don't field a position
        if (entry.active && entry.starter && pos && pos !== "DH") {
          fielders.push({ pos, name: sn });
        }
      }
    }

    // The current pitcher might have come in as a reliever and not be in the
    // starters roster, so also scan the boxscore pitching stats for their data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const entry of data.boxscore?.players ?? []) {
      // Find the pitching stats group by checking if it contains an "IP" column
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pitchSg = (entry.statistics ?? []).find((sg: any) => (sg.names ?? []).includes("IP"));
      if (!pitchSg) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const a of pitchSg.athletes ?? []) {
        const id = String(a.athlete?.id ?? "");
        if (!athleteById.has(id)) athleteById.set(id, a.athlete?.shortName ?? "");
        const hs = toHsUrl(a.athlete?.headshot);
        if (hs && !headshotById.has(id)) headshotById.set(id, hs);
      }
    }

    // The ESPN "situation" object stores batter/pitcher as playerId numbers
    const batterId  = String(sit.batter?.playerId  ?? "");
    const pitcherId = String(sit.pitcher?.playerId ?? "");

    // If the roster data didn't have a headshot, fall back to ESPN's CDN directly.
    // The CDN URL always follows this pattern for any athlete ID.
    const espnHeadshot = (id: string) =>
      id ? `https://a.espncdn.com/i/headshots/${sport}/players/full/${id}.png` : "";

    // Use roster headshot first; ESPN CDN URL as backup (|| vs ?? — || also covers empty strings)
    const batterHeadshot  = headshotById.get(batterId)  || espnHeadshot(batterId);
    const pitcherHeadshot = headshotById.get(pitcherId) || espnHeadshot(pitcherId);

    // ── Extract in-game stat lines ──────────────────────────────────────────
    // The boxscore contains a stats array for each player. We find the batter
    // and pitcher by ID and format their stats into a readable line.
    let batterGameLine = ""; let pitcherGameLine = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const entry of data.boxscore?.players ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const sg of entry.statistics ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const names: string[] = sg.names ?? []; // Column names e.g. ["AB","R","H","RBI",...]
        // Helper: looks up a stat value by column name for a given player row
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getStat = (row: any, col: string) => {
          const idx = names.indexOf(col); // Find the index of this column in the names array
          return idx >= 0 ? String(row.stats?.[idx] ?? "-") : "-";
        };

        // Batting stats group contains an "AB" column
        if (!batterGameLine && names.includes("AB")) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = (sg.athletes ?? []).find((a: any) => String(a.athlete?.id ?? "") === batterId);
          if (row) {
            const h = getStat(row,"H"), ab = getStat(row,"AB"),
                  hr = getStat(row,"HR"), rbi = getStat(row,"RBI"), k = getStat(row,"K");
            // Only include HR/RBI/K if they're non-zero — "0 HR" isn't interesting
            const extras = [hr!=="0"&&hr!=="-"?`${hr} HR`:"", rbi!=="0"&&rbi!=="-"?`${rbi} RBI`:"", k!=="0"&&k!=="-"?`${k} K`:""].filter(Boolean);
            batterGameLine = `${h}-${ab}${extras.length?`, ${extras.join(", ")}` : ""}`;
          }
        }

        // Pitching stats group contains an "IP" column
        if (!pitcherGameLine && names.includes("IP")) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = (sg.athletes ?? []).find((a: any) => String(a.athlete?.id ?? "") === pitcherId);
          if (row) {
            const ip = getStat(row,"IP"), h = getStat(row,"H"),
                  er = getStat(row,"ER"), k = getStat(row,"K"), bb = getStat(row,"BB");
            pitcherGameLine = `${ip} IP, ${h} H, ${er} ER, ${k} K, ${bb} BB`;
          }
        }
      }
    }

    // ── Determine base runner positions ────────────────────────────────────
    // The "situation" object has booleans for which bases are occupied, but they
    // sometimes lag. The most reliable source is the last "play-result" event
    // in the plays array, so we scan backwards to find it.
    let onFirst = false, onSecond = false, onThird = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plays: any[] = data.plays ?? [];
    for (let i = plays.length - 1; i >= 0; i--) {
      if (plays[i].type?.type === "play-result") {
        onFirst  = Boolean(plays[i].onFirst);
        onSecond = Boolean(plays[i].onSecond);
        onThird  = Boolean(plays[i].onThird);
        break; // Stop as soon as we find the most recent play result
      }
    }

    // ── Build the inning label ──────────────────────────────────────────────
    // Scan backwards through plays to find the most recent one with period info.
    // "period" = inning in ESPN's terminology; type = "Top" or "Bottom"
    let inningLabel = "";
    for (let i = plays.length - 1; i >= 0; i--) {
      const p = plays[i];
      if (p.period?.number) {
        const side = p.period.type === "Top" ? "▲" : "▼"; // ▲ = top of inning, ▼ = bottom
        inningLabel = `${side} ${p.period.number}`;
        break;
      }
    }

    // ── Collect this inning's play-by-play feed ─────────────────────────────
    // Find which inning is current, then gather the last 5 plays from that inning.
    let curInning = 0; let curSide = "";
    for (let i = plays.length - 1; i >= 0; i--) {
      if (plays[i].period?.number) { curInning = plays[i].period.number; curSide = plays[i].period.type ?? ""; break; }
    }
    const inningPlays: string[] = [];
    let latestPlay = "";
    for (let i = plays.length - 1; i >= 0; i--) {
      const p = plays[i];
      const desc: string = p.text ?? p.description ?? "";
      if (!desc.trim()) continue; // Skip plays with no description text
      if (p.period?.number === curInning && (p.period?.type ?? "") === curSide) {
        if (!latestPlay) latestPlay = desc; // First one we hit (scanning backwards) is the most recent
        if (inningPlays.length < 5) inningPlays.unshift(desc); // unshift adds to the front of the array
      } else if (latestPlay) break; // We've gone past the current inning — stop
    }

    // Return the fully assembled LiveSituation object
    return {
      balls: sit.balls ?? 0, strikes: sit.strikes ?? 0, outs: sit.outs ?? 0,
      onFirst, onSecond, onThird,
      batterName:  athleteById.get(batterId)  ?? "",
      pitcherName: athleteById.get(pitcherId) ?? "",
      inningLabel,
      fielders,
      batterHeadshot, pitcherHeadshot,
      batterGameLine, pitcherGameLine,
      latestPlay, inningPlays,
    };
  } catch { return null; } // If anything goes wrong, return null — the UI handles it gracefully
}

// Fetches all the data for the game details modal: box score, scoring plays, highlights.
// This endpoint returns a large JSON object — we pull out several pieces from it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchGameDetails(sport: Sport, eventId: string): Promise<GameDetails> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/${sport}/summary?event=${eventId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN API ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();

  // Pull out the two competitors (home and away teams)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const competitors: any[] = data.header?.competitions?.[0]?.competitors ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awayComp = competitors.find((c: any) => c.homeAway==="away");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeComp = competitors.find((c: any) => c.homeAway==="home");

  // Each team's "linescores" array has one entry per inning with that inning's runs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awayLS: any[] = awayComp?.linescores ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeLS: any[] = homeComp?.linescores ?? [];
  // Use whichever team has played more innings (handles extra innings)
  const numInnings = Math.max(awayLS.length, homeLS.length);

  // ── Build the line score table ─────────────────────────────────────────────
  let lineScore: LineScoreData | null = null;
  if (numInnings > 0) {
    // Headers: blank (for team name), then "1" through N, then "R", "H", "E"
    const headers = ["", ...Array.from({length:numInnings},(_,i)=>String(i+1)), "R","H","E"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const makeRow = (comp: any, ls: any[]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cells = ls.map((x: any) => x.displayValue!=null ? String(x.displayValue) : "-");
      // Pad with dashes for innings not yet played
      while (cells.length < numInnings) cells.push("-");
      // Append R (total score), H (total hits), E (total errors) at the end
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cells.push(String(comp?.score??"-"), String(ls.reduce((s:number,x:any)=>s+(x.hits??0),0)),
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                 String(ls.reduce((s:number,x:any)=>s+(x.errors??0),0)));
      return { abbr: comp?.team?.abbreviation??"", cells };
    };
    // rheStart tells the table where to start the highlighted R/H/E columns
    lineScore = { headers, rows:[makeRow(awayComp,awayLS),makeRow(homeComp,homeLS)], rheStart:numInnings+1 };
  }

  // Maps team ID → "home" or "away" so we can assign box score data to the right team
  const homeAwayById = new Map<string,string>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    competitors.map((c: any) => [String(c.team.id), c.homeAway as string])
  );
  // Maps team ID → their color values for dynamic theming
  const colorById = new Map<string,{color:string;altColor:string}>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    competitors.map((c: any) => [String(c.team.id),{color:c.team.color??"",altColor:c.team.alternateColor??""}])
  );

  // Safe stat accessor: returns "-" if the stat is missing or blank
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pickStat = (stats: any[], idx: number) => {
    const v = stats?.[idx]; return v!=null&&v!=="" ? String(v) : "-";
  };

  // Parses one team's entry from data.boxscore.players into a structured TeamBoxScore.
  // "Omit<TeamBoxScore, 'color'|'altColor'>" means we return everything except colors
  // (colors are added separately from colorById above).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseEntry = (entry: any): Omit<TeamBoxScore,"color"|"altColor"> => {
    const statGroups: StatGroup[] = [];
    for (const sg of entry.statistics ?? []) {
      const allNames: string[] = sg.names ?? [];
      const isBatting  = allNames.includes("AB"); // Batting groups have an "AB" column
      const isPitching = allNames.includes("IP"); // Pitching groups have an "IP" column
      if (!isBatting && !isPitching) continue;    // Skip any other stat groups

      // Filter down to only the columns we want to display
      const keepCols = isBatting ? BATTING_COLS : PITCHING_COLS;
      const keepIdx  = keepCols.map(n=>allNames.indexOf(n)).filter(i=>i>=0);
      const usedNames = keepIdx.map(i=>allNames[i]);
      let rows: PlayerRow[];
      if (isBatting) {
        const seenOrders = new Set<number>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows = (sg.athletes??[]).filter((a:any)=>!a.didNotPlay).map((a:any)=>{
          const batOrder:number = a.batOrder??0;
          // If the same batting order slot appears more than once, the second player is a sub
          const isSub = seenOrders.has(batOrder);
          seenOrders.add(batOrder);
          const position:string = a.position?.abbreviation??a.athlete?.position?.abbreviation??"";
          return { name:a.athlete?.shortName??a.athlete?.displayName??"?",
                   stats:keepIdx.map(i=>pickStat(a.stats,i)), batOrder, position, isSub };
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows = (sg.athletes??[]).filter((a:any)=>!a.didNotPlay).map((a:any)=>{
          // Look for a pitching decision note (Win, Loss, Save) attached to this pitcher
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const decNote = (a.notes??[]).find((n:any)=>n.type==="pitchingDecision");
          return { name:a.athlete?.shortName??a.athlete?.displayName??"?",
                   stats:keepIdx.map(i=>pickStat(a.stats,i)), note:decNote?.text as string|undefined };
        });
      }
      // Totals row only exists for batting; pitching doesn't total
      const totals = isBatting&&sg.totals ? keepIdx.map(i=>pickStat(sg.totals,i)) : undefined;
      statGroups.push({ type:isBatting?"batting":"pitching", headers:[isBatting?"Batter":"Pitcher",...usedNames], rows, totals });
    }
    return { name:entry.team?.displayName??"", abbr:entry.team?.abbreviation??"", logo:entry.team?.logo??"", statGroups };
  };

  // Start with empty team placeholders and fill them in from the boxscore
  const emptyTeam = (): TeamBoxScore => ({name:"",abbr:"",logo:"",color:"",altColor:"",statGroups:[]});
  let awayTeam = emptyTeam(); let homeTeam = emptyTeam();
  for (const entry of data.boxscore?.players ?? []) {
    const id = String(entry.team?.id??"");
    const ha = homeAwayById.get(id);                          // "home" or "away"
    const colors = colorById.get(id) ?? {color:"",altColor:""};
    const parsed = {...parseEntry(entry),...colors};           // Spread merges two objects
    if (ha==="away") awayTeam=parsed; else if (ha==="home") homeTeam=parsed;
  }

  // ── Extract game notes (extra base hits, errors) ────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractNotes = (teamData: any, abbr: string): TeamNotes => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const batting = (teamData.details??[]).find((d:any)=>d.name==="battingDetails")?.stats??[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fielding = (teamData.details??[]).find((d:any)=>d.name==="fieldingDetails")?.stats??[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const get = (arr:any[], name:string) => arr.find((s:any)=>s.name===name)?.displayValue??"";
    return { teamAbbr:abbr, doubles:get(batting,"doubles"), triples:get(batting,"triples"),
             homeRuns:get(batting,"homeruns"), errors:get(fielding,"errors") };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bsTeams: any[] = data.boxscore?.teams ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awayBsTeam = bsTeams.find((t:any)=>t.homeAway==="away") ?? bsTeams[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeBsTeam = bsTeams.find((t:any)=>t.homeAway==="home") ?? bsTeams[1];
  const teamNotes: [TeamNotes,TeamNotes] = [
    extractNotes(awayBsTeam??{}, awayComp?.team?.abbreviation??""),
    extractNotes(homeBsTeam??{}, homeComp?.team?.abbreviation??""),
  ];

  // ── Extract pitching decisions (W/L/Save) ───────────────────────────────────
  const pitchingDecision: PitchingDecision = {};
  for (const entry of data.boxscore?.players ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pitchSg = (entry.statistics??[]).find((sg:any)=>(sg.names??[]).includes("IP"));
    if (!pitchSg) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const a of pitchSg.athletes??[]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dec = (a.notes??[]).find((n:any)=>n.type==="pitchingDecision");
      if (!dec) continue;
      const name = a.athlete?.shortName??a.athlete?.displayName??"?";
      const text: string = dec.text??""; // e.g. "W (4-2)" or "L (2-5)" or "S (8)"
      if (text.startsWith("W")) pitchingDecision.winner=`${name} (${text})`;
      else if (text.startsWith("L")) pitchingDecision.loser=`${name} (${text})`;
      else if (text.startsWith("S")) pitchingDecision.save=`${name} (${text})`;
    }
  }

  // ── Build scoring plays list ────────────────────────────────────────────────
  // Filter all plays down to only the ones where runs scored, then format each
  const awayAbbr = awayComp?.team?.abbreviation??awayTeam.abbr;
  const homeAbbr = homeComp?.team?.abbreviation??homeTeam.abbr;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compById = new Map<string,any>(competitors.map((c:any)=>[String(c.team.id),c]));
  const scoringPlays: ScoringPlay[] = (data.plays??[])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((p:any)=>p.scoringPlay) // Only include plays ESPN flags as scoring plays
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((play:any)=>{
      const isTop = play.period?.type==="Top"; // Top of inning = away team batting
      const inningLabel = `${isTop?"Top":"Bot"} ${play.period?.number??"?"}`;
      // Find which team scored by matching the play's team ID
      const matchComp = play.team?.id!=null ? compById.get(String(play.team.id)) : isTop?awayComp:homeComp;
      return { inningLabel, teamAbbr:matchComp?.team?.abbreviation??(isTop?awayAbbr:homeAbbr),
               teamLogo:matchComp?.team?.logo??"", description:play.text??"",
               awayScore:play.awayScore??0, homeScore:play.homeScore??0, awayAbbr, homeAbbr };
    });

  // ── Build highlights list ───────────────────────────────────────────────────
  // Filter to only videos that have both a link and a thumbnail image
  const highlights: Highlight[] = (data.videos??[])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((v:any)=>({ id:String(v.id??Math.random()), headline:v.headline??"",
                     thumbnail:v.thumbnail??"", href:v.links?.web?.href??"" }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((h:any)=>h.href&&h.thumbnail);

  return { lineScore, teams:[awayTeam,homeTeam], scoringPlays, teamNotes, pitchingDecision, highlights };
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
// A simple loading indicator. The spinning animation is defined in App.css.
// "role" and "aria-label" are accessibility attributes that tell screen readers
// what this element represents.
function Spinner() { return <div className="spinner" role="status" aria-label="Loading" />; }

// ─── Hero Carousel ────────────────────────────────────────────────────────────
// The full-width image slider at the top of the page showing baseball news.
// Automatically advances every 6 seconds and supports manual prev/next navigation.

function HeroCarousel({ items, sport }: { items: NewsItem[]; sport: Sport }) {
  // `current` is the index (0, 1, 2...) of the slide currently being shown
  const [current, setCurrent] = useState(0);
  // useRef stores a reference to the auto-advance timer so we can cancel it
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Starts (or restarts) the 6-second auto-advance timer.
  // useCallback ensures this function reference stays stable across renders.
  const startTimer = useCallback((items: NewsItem[]) => {
    if (timerRef.current) clearInterval(timerRef.current); // Cancel any existing timer first
    if (items.length > 1) {
      // setInterval calls a function repeatedly at the given interval (in ms)
      // c => (c+1) % items.length wraps back to 0 after the last slide
      timerRef.current = setInterval(() => setCurrent(c => (c+1) % items.length), 6000);
    }
  }, []);

  // When the items list changes (i.e., sport changed), reset to slide 0 and restart the timer.
  // The returned cleanup function runs when the component unmounts — clearing the timer prevents
  // memory leaks.
  useEffect(() => { setCurrent(0); startTimer(items); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, [items, startTimer]);

  // Jump to a specific slide and restart the timer (so it doesn't advance right after you click)
  const goTo = (i: number) => { setCurrent(i); startTimer(items); };
  const prev = () => goTo((current - 1 + items.length) % items.length);
  const next = () => goTo((current + 1) % items.length);

  // If there are no news articles, show a placeholder with a sport icon
  if (items.length === 0) {
    return (
      <div className="carousel carousel--empty">
        <div className="carousel__placeholder">
          <span className="carousel__placeholder-icon" aria-hidden="true">
            {sport === "mlb" ? <BaseballCap size={48} weight="duotone" /> : <GraduationCap size={48} weight="duotone" />}
          </span>
          <h2 className="carousel__placeholder-title">{sport === "mlb" ? "MLB" : "College Baseball"}</h2>
          <p className="carousel__placeholder-sub">Live Scores · Box Scores · Standings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="carousel">
      {/* Each slide is a div with the article's image as its background.
          Only the active slide gets the "--active" modifier class which sets opacity: 1.
          The CSS transition fades between them. */}
      {items.map((item, i) => (
        <div key={item.id}
          className={`carousel__slide${i===current ? " carousel__slide--active" : ""}`}
          style={{ backgroundImage: `url(${item.imageUrl})` }} />
      ))}

      {/* Dark gradient overlay so text is readable over any photo */}
      <div className="carousel__gradient" />

      {/* The text content for the current slide. `key={current}` tells React to
          treat this as a new element whenever the slide changes, triggering the
          fade-in animation again. */}
      <div className="carousel__body" key={current}>
        {items[current]?.category && (
          <span className="carousel__label">{items[current].category}</span>
        )}
        <h2 className="carousel__headline">{items[current]?.headline}</h2>
        {items[current]?.description && (
          <p className="carousel__desc">{items[current].description}</p>
        )}
        {items[current]?.href && (
          // target="_blank" opens the link in a new tab
          // rel="noopener noreferrer" is a security best practice for external links
          <a href={items[current].href} target="_blank" rel="noopener noreferrer" className="carousel__cta">
            Read more →
          </a>
        )}
      </div>

      {/* Only show navigation controls if there's more than one slide */}
      {items.length > 1 && (
        <>
          {/* <> is a React Fragment — a wrapper that doesn't add a real HTML element */}
          <button type="button" className="carousel__btn carousel__btn--prev" onClick={prev} aria-label="Previous"><CaretLeft size={18} weight="bold" /></button>
          <button type="button" className="carousel__btn carousel__btn--next" onClick={next} aria-label="Next"><CaretRight size={18} weight="bold" /></button>
          {/* Dot indicators at the bottom right — one per slide */}
          <div className="carousel__dots">
            {items.map((_, i) => (
              // The _ is a convention for "I don't need this parameter" (the item value)
              <button type="button" key={i} className={`carousel__dot${i===current?" carousel__dot--active":""}`} onClick={() => goTo(i)} aria-label={`Slide ${i+1}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Date Nav ─────────────────────────────────────────────────────────────────
// The date selector bar shown above the scores grid.
// Displays the current date with prev/next arrows, a "Back to Today" button,
// and a live game count badge when there are active games.

function DateNav({ date, setDate, liveCount }: { date: Date; setDate: (d: Date) => void; liveCount?: number }) {
  return (
    <div className="date-nav">
      <button type="button" className="date-nav__arrow" onClick={() => setDate(shiftDay(date,-1))} aria-label="Previous day"><CaretLeft size={16} weight="bold" /></button>
      <div className="date-nav__center">
        <p className="date-nav__label">{formatDisplayDate(date)}</p>
        {/* Show "Back to Today" if browsing a different date, otherwise show live count */}
        {!isToday(date) ? (
          <button type="button" className="today-btn" onClick={() => setDate(new Date())}>Back to Today</button>
        ) : (liveCount ?? 0) > 0 ? (
          // The `!` after liveCount tells TypeScript "I know this is defined" (non-null assertion)
          <span className="live-count">{liveCount} game{liveCount!>1?"s":""} live</span>
        ) : null}
      </div>
      <button type="button" className="date-nav__arrow" onClick={() => setDate(shiftDay(date,1))} aria-label="Next day"><CaretRight size={16} weight="bold" /></button>
    </div>
  );
}

// ─── Animated Score ───────────────────────────────────────────────────────────
// A score number that "ticks" like a broadcast graphic: when the value changes,
// the old digit slides up and out while the new one springs up into place.
// AnimatePresence with a key on the value drives the swap.

function AnimatedScore({ value, className }: { value: string; className?: string }) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return <span className={className}>{value}</span>;
  return (
    <span className={className} style={{ display: "inline-grid", overflow: "hidden" }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value} // New value = new element = enter/exit animation
          initial={{ y: "0.9em", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-0.9em", opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          style={{ display: "inline-block" }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// ─── Game Card ────────────────────────────────────────────────────────────────
// A clickable card representing a single game in the scores grid.
// Shows both teams, their scores, and the game status.
// Team colors paint the left accent edge (away on top, home on bottom).
// When a run scores during auto-refresh, the card flashes in the scoring
// team's color and the score digit ticks like a broadcast graphic.

function GameCard({ game, onClick }: { game: Game; onClick: () => void }) {
  const isFinal = game.status==="STATUS_FINAL";
  const isLive  = game.status==="STATUS_IN_PROGRESS";
  const variants = useBlurSlideUp(); // Picks full or reduced-motion animation

  // Score-change detection: remember the last scores we rendered; when a new
  // score arrives from polling, flash the card in the scoring team's color.
  const prevScores = useRef<{ away: string; home: string } | null>(null);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  useEffect(() => {
    const prev = prevScores.current;
    prevScores.current = { away: game.away.score, home: game.home.score };
    if (prev && (prev.away !== game.away.score || prev.home !== game.home.score)) {
      // Whichever side's score changed is the team that scored
      const scorer = prev.away !== game.away.score ? game.away : game.home;
      setFlashColor(teamHex(scorer.color, "00e639"));
      const t = setTimeout(() => setFlashColor(null), 1500); // Matches CSS animation length
      return () => clearTimeout(t);
    }
  }, [game.away.score, game.home.score, game.away, game.home]);

  // CSS custom properties feed the accent edge + flash color into App.css rules
  const cardStyle = {
    "--away-color": teamHex(game.away.color, "47464f"),
    "--home-color": teamHex(game.home.color, "47464f"),
    ...(flashColor ? { "--flash-color": flashColor } : {}),
  } as CSSProperties;

  return (
    // motion.button is a regular HTML button with Framer Motion animation props
    <motion.button
      type="button"
      className={`game-card${isLive?" game-card--live":""}${flashColor?" game-card--flash":""}`}
      style={cardStyle}
      onClick={onClick}
      aria-label={`${game.away.name} vs ${game.home.name}, ${game.statusDetail}`}
      variants={variants}    // Defines hidden/visible states for the enter animation
      whileHover={cardHover} // Applied when the user hovers over the card
      whileTap={{ scale: 0.97 }} // Slight press-down effect on click
    >
      {/* Status badge row — shows LIVE / Final / scheduled time */}
      <div className="game-card__status">
        {isLive  && <span className="badge badge--live">● LIVE</span>}
        {isFinal && <span className="badge badge--final">Final</span>}
        {!isLive && !isFinal && <span className="badge badge--scheduled">{game.statusDetail}</span>}
        {isLive  && <span className="game-card__inning">{game.statusDetail}</span>}
      </div>

      {/* Away and home team rows — rendered by mapping over the two sides */}
      {(["away","home"] as const).map(side => {
        const t = game[side]; // game["away"] or game["home"]
        return (
          <div key={side} className={`team-row${t.winner?" team-row--winner":""}`}>
            {/* Show team logo if available, otherwise a baseball icon */}
            {t.logo
              ? <img src={t.logo} alt={t.name} className="team-logo" />
              : <div className="team-logo team-logo--placeholder" aria-hidden="true"><Baseball size={18} weight="duotone" /></div>}
            <span className="team-name">{t.name}</span>
            {/* Don't show a score for scheduled games — it would just be "0" */}
            {!game.status.includes("SCHEDULED") && (
              <AnimatedScore value={t.score} className={`score${t.winner?" score--bold":""}`} />
            )}
          </div>
        );
      })}
      <div className="game-card__cta">View details →</div>
    </motion.button>
  );
}

// ─── Score Ticker ─────────────────────────────────────────────────────────────
// The MLB At Bat-style strip of mini scoreboards pinned below the sticky nav.
// Always shows TODAY's games (even while browsing other dates), polls every
// 30 seconds, sorts live games first, and opens the game modal on click.

function ScoreTicker({ games, onSelect }: { games: Game[]; onSelect: (id: string) => void }) {
  if (games.length === 0) return null;

  // Live games lead the strip, then scheduled, then finals
  const order = (g: Game) =>
    g.status === "STATUS_IN_PROGRESS" ? 0 : g.status === "STATUS_FINAL" ? 2 : 1;
  const sorted = [...games].sort((a, b) => order(a) - order(b));

  return (
    <div className="score-ticker">
      <div className="score-ticker__scroll" role="list" aria-label="Today's games">
        <span className="score-ticker__label" aria-hidden="true">Today</span>
        {sorted.map(g => {
          const isLive  = g.status === "STATUS_IN_PROGRESS";
          const isFinal = g.status === "STATUS_FINAL";
          const showScores = !g.status.includes("SCHEDULED");
          return (
            <button
              type="button"
              key={g.id}
              role="listitem"
              className={`ticker-chip${isLive ? " ticker-chip--live" : ""}`}
              style={{ "--chip-color": teamHex(g.home.color, "47464f") } as CSSProperties}
              onClick={() => onSelect(g.id)}
              aria-label={`${g.away.abbreviation} at ${g.home.abbreviation}, ${g.statusDetail}`}
            >
              <span className={`ticker-chip__status${isLive ? " ticker-chip__status--live" : ""}`}>
                {isLive ? `● ${g.statusDetail}` : isFinal ? "Final" : g.statusDetail}
              </span>
              {(["away","home"] as const).map(side => {
                const t = g[side];
                return (
                  <span key={side} className={`ticker-chip__row${t.winner ? " ticker-chip__row--winner" : ""}`}>
                    {t.logo && <img src={t.logo} alt="" className="ticker-chip__logo" />}
                    <span className="ticker-chip__abbr">{t.abbreviation || t.name.slice(0,4)}</span>
                    {showScores && <AnimatedScore value={t.score} className="ticker-chip__score" />}
                  </span>
                );
              })}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Batting Table ────────────────────────────────────────────────────────────
// Renders a team's batting box score as an HTML table.
// The teamColor is used to color the batting order numbers and the header underline.

function BattingTable({ group, teamColor }: { group: StatGroup; teamColor: string }) {
  return (
    <div className="table-scroll"> {/* Wrapper allows horizontal scrolling on small screens */}
      <table className="stats-table">
        <thead>
          {/* `style` in JSX takes a JS object — note camelCase (borderBottom, not border-bottom) */}
          <tr style={{ borderBottom: `2px solid ${teamColor}40` }}>
            <th className="th-order">#</th>  {/* Batting order number */}
            <th className="th-pos">Pos</th>  {/* Field position */}
            {group.headers.map((h,i) => <th key={i} className={i===0?"th-player":"th-stat"}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {group.rows.map((row,i) => (
            // Substitution rows get a dimmed style via the "sub-row" class
            <tr key={i} className={row.isSub?"sub-row":""}>
              {/* Batting order number in team color; blank for substitutions */}
              <td className="td-order" style={{color:teamColor}}>{row.isSub?"":row.batOrder}</td>
              <td className="td-pos">{row.position}</td>
              <td className={`td-player${row.isSub?" td-player--sub":""}`}>{row.name}</td>
              {row.stats.map((s,j) => <td key={j} className="td-center">{s}</td>)}
            </tr>
          ))}
          {/* Totals row at the bottom — only present for batting groups */}
          {group.totals && (
            <tr className="totals-row">
              <td /><td /> {/* Empty cells for the # and Pos columns */}
              <td className="td-player">Totals</td>
              {group.totals.map((t,i) => <td key={i} className="td-center">{t}</td>)}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Pitching Table ───────────────────────────────────────────────────────────
// Renders a team's pitching box score. Similar to BattingTable but no order/position
// columns, and pitchers can have a W/L/S decision badge next to their name.

function PitchingTable({ group, teamColor }: { group: StatGroup; teamColor: string }) {
  return (
    <div className="table-scroll">
      <table className="stats-table">
        <thead>
          <tr style={{ borderBottom: `2px solid ${teamColor}40` }}>
            {group.headers.map((h,i) => <th key={i} className={i===0?"th-player":"th-stat"}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {group.rows.map((row,i) => (
            <tr key={i}>
              <td className="td-player">
                {row.name}
                {/* If this pitcher has a decision, show a colored W/L/S badge */}
                {row.note && (
                  // Dynamically pick the right color class: --w (green), --l (red), --s (blue)
                  <span className={`decision-badge decision-badge--${row.note.startsWith("W")?"w":row.note.startsWith("L")?"l":"s"}`}>
                    {" "}{row.note.split(",")[0]} {/* Only show "W (4-2)" not the full note */}
                  </span>
                )}
              </td>
              {row.stats.map((s,j) => <td key={j} className="td-center">{s}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Game Notes ───────────────────────────────────────────────────────────────
// The section at the bottom of the box score showing extra base hits, errors,
// and the pitching decisions (Win / Loss / Save).
// Returns null (renders nothing) if there's no data to show.

function GameNotes({ teamNotes, decision }: { teamNotes: [TeamNotes,TeamNotes]; decision: PitchingDecision }) {
  // Check if any of these sections have data worth showing
  const hasXBH    = teamNotes.some(n=>n.doubles||n.triples||n.homeRuns); // Extra base hits
  const hasErrors = teamNotes.some(n=>n.errors);
  const hasDec    = decision.winner||decision.loser||decision.save;
  if (!hasXBH && !hasErrors && !hasDec) return null; // Nothing to render
  return (
    <div className="game-notes">
      {hasXBH && (
        <div className="notes-block">
          <h4 className="notes-title">Extra Base Hits</h4>
          {teamNotes.map((n,i) => (n.doubles||n.triples||n.homeRuns) && (
            <div key={i} className="notes-team-row">
              <span className="notes-abbr">{n.teamAbbr}</span>
              <div className="notes-items">
                {n.doubles  && <span className="notes-item"><span className="notes-label">2B</span> {n.doubles}</span>}
                {n.triples  && <span className="notes-item"><span className="notes-label">3B</span> {n.triples}</span>}
                {n.homeRuns && <span className="notes-item"><span className="notes-label">HR</span> {n.homeRuns}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {hasErrors && (
        <div className="notes-block">
          <h4 className="notes-title">Errors</h4>
          {teamNotes.map((n,i) => n.errors && (
            <div key={i} className="notes-team-row">
              <span className="notes-abbr">{n.teamAbbr}</span>
              <span className="notes-text">{n.errors}</span>
            </div>
          ))}
        </div>
      )}
      {hasDec && (
        <div className="notes-block">
          <h4 className="notes-title">Pitching Decisions</h4>
          <div className="decisions-row">
            {decision.winner && (
              <span className="decision-pill decision-pill--w">
                <strong>W</strong> {decision.winner.replace(/\s*\(W[^)]*\)/,"")}
                {/* regex extracts the record in parentheses e.g. "4-2" */}
                <span className="decision-record">{" "}{decision.winner.match(/\(([^)]+)\)/)?.[1]??""}</span>
              </span>
            )}
            {decision.loser && (
              <span className="decision-pill decision-pill--l">
                <strong>L</strong> {decision.loser.replace(/\s*\(L[^)]*\)/,"")}
                <span className="decision-record">{" "}{decision.loser.match(/\(([^)]+)\)/)?.[1]??""}</span>
              </span>
            )}
            {decision.save && (
              <span className="decision-pill decision-pill--s">
                <strong>SV</strong> {decision.save.replace(/\s*\(S[^)]*\)/,"")}
                <span className="decision-record">{" "}{decision.save.match(/\(([^)]+)\)/)?.[1]??""}</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Highlights Section ───────────────────────────────────────────────────────
// A grid of clickable video thumbnail cards, shown when ESPN has highlight videos.
// Each card links to the video on ESPN's website.

function HighlightsSection({ highlights }: { highlights: Highlight[] }) {
  if (highlights.length===0) return <div className="modal-empty">No highlights available for this game.</div>;
  return (
    <div className="highlights-grid">
      {highlights.map(h => (
        <a key={h.id} href={h.href} target="_blank" rel="noopener noreferrer" className="highlight-card">
          <div className="highlight-thumb-wrap">
            <img src={h.thumbnail} alt="" className="highlight-thumb" />
            <div className="highlight-play" aria-hidden="true"><Play size={28} weight="fill" /></div>
          </div>
          <p className="highlight-headline">{h.headline}</p>
        </a>
      ))}
    </div>
  );
}

// ─── Live Diamond ─────────────────────────────────────────────────────────────

// Maps each fielding position to its (x, y) coordinates on the 300×270 SVG canvas.
// The field is drawn top-down: center field is at the top (y≈20), home plate at bottom (y≈228).
const FIELD_COORDS: Record<string, [number, number]> = {
  P:  [150, 149], C:  [150, 249],
  "1B": [238, 166], "2B": [193, 110], SS: [107, 110], "3B": [62, 166],
  LF: [32, 50],   CF: [150, 20],    RF: [268, 50],
};

// Truncates a player name to fit on the field graphic.
// Adds "…" if the name is longer than `max` characters.
function truncName(n: string, max = 9) { return n.length > max ? n.slice(0, max - 1) + "…" : n; }

// ─── LivePlayerCard ───────────────────────────────────────────────────────────
// Renders a pitcher or batter card with headshot, role badge, name, and game stats.
// Handles image loading failures gracefully by falling back to an emoji placeholder.

function LivePlayerCard({ name, headshot, gameLine, role }: {
  name: string; headshot: string; gameLine: string; role: "BAT"|"PIT";
}) {
  // Tracks whether the headshot image failed to load (e.g. 404 from ESPN CDN)
  const [imgFailed, setImgFailed] = useState(false);
  // Show the image only if we have a URL AND it hasn't failed yet
  const showImg = Boolean(headshot) && !imgFailed;
  return (
    <div className="live-player-card">
      <div className="live-player-photo-wrap">
        {showImg
          // onError fires if the browser can't load the image — we flag it and show the placeholder
          ? <img src={headshot} alt={name} className="live-player-photo" onError={() => setImgFailed(true)} />
          : <div className="live-player-photo-placeholder" aria-hidden="true"><User size={26} weight="duotone" /></div>
        }
      </div>
      <div className="live-player-info">
        {/* role.toLowerCase() turns "PIT" into "pit" for the CSS class live-role--pit */}
        <span className={`live-role live-role--${role.toLowerCase()}`}>{role}</span>
        <span className="live-player-name">{name}</span>
        {/* Only render the game line if it has content */}
        {gameLine && <span className="live-game-line">{gameLine}</span>}
      </div>
    </div>
  );
}

// ─── LiveDiamond ─────────────────────────────────────────────────────────────
// The main live Gamecast view: an SVG baseball field with all fielders plotted,
// plus a sidebar showing BSO count, base runners, and the pitcher vs. batter matchup.
// Also shows a play-by-play feed for the current inning below.

function LiveDiamond({ sit }: { sit: LiveSituation }) {
  // The four base vertices on the SVG (home plate, 1B, 2B, 3B)
  const HP: [number,number] = [150, 228]; // Home plate — bottom center
  const B1: [number,number] = [228, 153]; // First base  — right
  const B2: [number,number] = [150, 78];  // Second base — top center
  const B3: [number,number] = [72,  153]; // Third base  — left

  // Build a map from position → player name for quick lookup in the SVG rendering
  const fieldMap: Record<string, string> = {};
  for (const f of sit.fielders) fieldMap[f.pos] = f.name;

  // Returns the fill color for a base: orange if occupied, faded tan if empty
  const baseColor  = (on: boolean) => on ? "#f97316" : "rgba(200,180,150,0.45)";
  // Returns an orange glow filter for occupied bases, or none for empty
  const baseShadow = (on: boolean) => on ? "drop-shadow(0 0 5px #f97316aa)" : "none";

  return (
    <div className="live-diamond-wrap">

      {/* ── Inning banner at the top ── */}
      <div className="live-inning-bar">
        {sit.inningLabel && <span className="live-inning">{sit.inningLabel}</span>}
        <span className="live-badge-dot">● LIVE</span>
        {/* Auto-refresh indicator — reassures the user the view updates itself */}
        <span className="live-update-indicator">
          <span className="live-update-indicator__dot" aria-hidden="true" />
          Auto-updates · 20s
        </span>
      </div>

      {/* ── Two-column body: SVG field (left) + info panel (right) ── */}
      <div className="live-diamond-body">

        {/* ── SVG Baseball Field ── */}
        {/* viewBox="0 0 300 270" defines the coordinate system regardless of display size */}
        <svg viewBox="0 0 300 270" className="diamond-svg" role="img" aria-label={`Baseball field: ${sit.inningLabel}. Bases: ${sit.onFirst?"1st,":""}${sit.onSecond?"2nd,":""}${sit.onThird?"3rd,":""} ${!sit.onFirst&&!sit.onSecond&&!sit.onThird?"empty":""}`}>

          {/* Dark green grass background covering the whole SVG */}
          <rect width={300} height={270} fill="#1e5c1e" rx={8} />

          {/* Foul lines extending from home plate to the upper corners */}
          <line x1={HP[0]} y1={HP[1]} x2={0}   y2={10} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
          <line x1={HP[0]} y1={HP[1]} x2={300}  y2={10} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />

          {/* The tan dirt infield — a diamond polygon connecting all four bases */}
          <polygon
            points={`${HP[0]},${HP[1]} ${B1[0]},${B1[1]} ${B2[0]},${B2[1]} ${B3[0]},${B3[1]}`}
            fill="#c8a47a"
          />

          {/* Darker grass square inside the dirt, giving contrast to the infield */}
          <polygon
            points="150,215 215,153 150,91 85,153"
            fill="#2d7a2d"
          />

          {/* Pitcher's mound — a small tan circle at the center of the diamond */}
          <circle cx={150} cy={149} r={12} fill="#c8a47a" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />

          {/* The four base paths as white lines connecting each base to the next */}
          {[[HP,B1],[B1,B2],[B2,B3],[B3,HP]].map(([a,b],i) => (
            <line key={i} x1={(a as [number,number])[0]} y1={(a as [number,number])[1]}
              x2={(b as [number,number])[0]} y2={(b as [number,number])[1]}
              stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />
          ))}

          {/* ── Bases — drawn as rotated squares (diamonds) ── */}
          {/* Each base uses a <g> (group) so the glow filter and the "base-pop"
              spring animation (applied via the .base-occupied class the moment a
              runner reaches the base) affect the whole group */}
          {([
            { on: sit.onFirst,  pt: B1 },
            { on: sit.onSecond, pt: B2 },
            { on: sit.onThird,  pt: B3 },
          ] as const).map(({ on, pt }, i) => (
            <g key={i} filter={baseShadow(on)} className={on ? "base-occupied" : undefined}>
              <rect x={pt[0]-8} y={pt[1]-8} width={16} height={16}
                fill={baseColor(on)} rx={1}
                transform={`rotate(45,${pt[0]},${pt[1]})`} /> {/* Rotate 45° around the center point */}
            </g>
          ))}

          {/* Home plate — a white pentagon shape */}
          <polygon
            points={`${HP[0]},${HP[1]+9} ${HP[0]+8},${HP[1]+2} ${HP[0]+8},${HP[1]-7} ${HP[0]-8},${HP[1]-7} ${HP[0]-8},${HP[1]+2}`}
            fill="white"
          />

          {/* Batter's boxes — faint rectangles on each side of home plate */}
          <rect x={HP[0]+8}  y={HP[1]-17} width={12} height={20} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />
          <rect x={HP[0]-20} y={HP[1]-17} width={12} height={20} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />

          {/* ── Fielder markers — one circle per position ── */}
          {/* Object.entries() converts the FIELD_COORDS map into an array of [key, value] pairs */}
          {Object.entries(FIELD_COORDS).map(([pos, [cx, cy]]) => {
            const name = fieldMap[pos] ?? ""; // Look up player name, default to empty string
            const isAbove = cy < 80; // CF is near the top of the SVG — put its label below instead
            return (
              <g key={pos}>
                {/* Offset shadow circle for a depth effect */}
                <circle cx={cx} cy={cy} r={14} fill="rgba(0,0,0,0.3)" transform="translate(1,1)" />
                {/* Main circle — deep navy blue */}
                <circle cx={cx} cy={cy} r={13}
                  fill="rgba(15,40,100,0.82)"
                  stroke="rgba(255,255,255,0.65)" strokeWidth={1.5}
                />
                {/* Position abbreviation inside the circle */}
                <text x={cx} y={cy+4} textAnchor="middle"
                  fontSize={pos.length > 2 ? "7.5" : "9"} fontWeight="bold"
                  fill="white" fontFamily="Inter,sans-serif">
                  {pos}
                </text>
                {/* Player name label above or below the circle.
                    paintOrder="stroke fill" draws the dark stroke BEHIND the white fill,
                    creating a dark outline that makes the text readable on any background. */}
                {name && (
                  <text x={cx} y={isAbove ? cy+27 : cy-19} textAnchor="middle"
                    fontSize="8.5" fill="white" fontWeight="700"
                    fontFamily="Inter,sans-serif"
                    stroke="#0a1a10" strokeWidth="3"
                    paintOrder="stroke fill">
                    {truncName(name)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* ── Info panel (right side) ── */}
        <div className="live-panel">

          {/* BSO count indicators — Balls, Strikes, Outs */}
          {/* Each row shows a label, filled/empty dot indicators, and a number */}
          <div className="bso-block">
            {([
              { label: "B", filled: sit.balls,   total: 4, type: "ball"   },
              { label: "S", filled: sit.strikes, total: 3, type: "strike" },
              { label: "O", filled: sit.outs,    total: 3, type: "out"    },
            ] as const).map(({ label, filled, total, type }) => (
              <div key={label} className="bso-row">
                <span className="bso-label">{label}</span>
                <div className="bso-dots">
                  {/* Array.from creates an array of `total` items, then maps each to a dot div */}
                  {Array.from({ length: total }, (_, i) => (
                    // Dots at index < filled get a colored class (bso-dot--ball etc.)
                    <div key={i} className={`bso-dot${i < filled ? ` bso-dot--${type}` : ""}`} />
                  ))}
                </div>
                <span className="bso-num">{filled}</span>
              </div>
            ))}
          </div>

          {/* Runner pills — 1B/2B/3B, highlighted orange when occupied */}
          <div className="live-runners">
            {[["1B", sit.onFirst], ["2B", sit.onSecond], ["3B", sit.onThird]].map(([base, on]) => (
              <div key={String(base)} className={`live-runner-pill${on ? " live-runner-pill--on" : ""}`}>
                {String(base)}
              </div>
            ))}
          </div>

          {/* Pitcher vs. Batter matchup cards */}
          <div className="live-matchup">
            <LivePlayerCard
              name={sit.pitcherName || "—"}
              headshot={sit.pitcherHeadshot}
              gameLine={sit.pitcherGameLine}
              role="PIT"
            />
            <div className="live-vs-bar">VS</div>
            <LivePlayerCard
              name={sit.batterName || "—"}
              headshot={sit.batterHeadshot}
              gameLine={sit.batterGameLine}
              role="BAT"
            />
          </div>
        </div>
      </div>

      {/* ── Inning play-by-play feed ── */}
      {/* Only renders if there are plays to show — an empty array is falsy in JS */}
      {sit.inningPlays.length > 0 && (
        <div className="live-pbp">
          <div className="live-pbp__header">
            <span className="live-pbp__title">THIS INNING</span>
            <span className="live-badge-dot">● LIVE</span>
          </div>
          <ul className="live-pbp__list">
            {sit.inningPlays.map((play, i) => {
              const isLatest = i === sit.inningPlays.length - 1;
              // The most recent play is keyed by its text so a NEW play
              // triggers the enter animation (slide + fade in)
              return (
                <motion.li
                  key={isLatest ? play : i}
                  className={`live-pbp__item${isLatest ? " live-pbp__item--latest" : ""}`}
                  initial={isLatest ? { opacity: 0, x: -12 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                >
                  {play}
                </motion.li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Standings Section ────────────────────────────────────────────────────────
// Shows either MLB division standings or college Top 25 rankings,
// depending on which sport is selected. Fetches data on mount and when sport changes.

function StandingsSection({ sport }: { sport: Sport }) {
  const [mlbGroups, setMLBGroups] = useState<StandingsGroup[]>([]);
  const [rankings,  setRankings]  = useState<RankingEntry[]>([]);
  const [loading,   setLoading]   = useState(true);

  // useEffect with [sport] in the dependency array re-runs whenever `sport` changes
  useEffect(() => {
    setLoading(true);
    if (sport==="mlb") {
      // .then() runs a function when the promise resolves (data arrives)
      fetchMLBStandings().then(g => { setMLBGroups(g); setLoading(false); });
    } else {
      fetchCollegeRankings().then(r => { setRankings(r); setLoading(false); });
    }
  }, [sport]); // Dependency array — effect re-runs when `sport` changes

  if (loading) return <div className="center-message"><Spinner /><p>Loading…</p></div>;

  // ── MLB standings view ──────────────────────────────────────────────────────
  if (sport==="mlb") {
    const leagues = ["American League","National League"];
    return (
      <div className="standings-page">
        {leagues.map(ln => {
          // Filter all division groups down to only the ones in this league
          const divs = mlbGroups.filter(g=>g.league===ln);
          return (
            <div key={ln} className="standings-league">
              <h2 className="standings-league__name">{ln}</h2>
              <div className="standings-divisions">
                {divs.map(group => (
                  <div key={group.division} className="standings-group">
                    {/* Strip the league prefix from the division name: "American League East" → "East" */}
                    <div className="standings-group__div">{group.division.replace(ln+" ","")}</div>
                    <div className="table-scroll">
                      <table className="standings-table">
                        <thead>
                          <tr>
                            <th className="st-col-team">Team</th>
                            <th>W</th><th>L</th><th>PCT</th><th>GB</th>
                            {/* st-hide-sm class hides these columns on small screens */}
                            <th className="st-hide-sm">Home</th>
                            <th className="st-hide-sm">Away</th>
                            <th className="st-hide-sm">L10</th>
                            <th>Str</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.entries.map((e,i) => (
                            // The first row (i===0) is the division leader — it gets bold styling
                            <tr key={e.abbr} className={i===0?"st-leader-row":""}>
                              <td className="st-col-team">
                                <div className="st-team-cell">
                                  {e.logo && <img src={e.logo} alt="" className="st-logo" />}
                                  <span className="st-team-name">{e.name}</span>
                                </div>
                              </td>
                              <td>{e.wins}</td><td>{e.losses}</td><td>{e.pct}</td>
                              {/* Division leader shows "—" in green; others show the numeric GB */}
                              <td className={e.gb==="-"?"st-gb-leader":""}>{e.gb==="-"?"—":e.gb}</td>
                              <td className="st-hide-sm">{e.home}</td>
                              <td className="st-hide-sm">{e.away}</td>
                              <td className="st-hide-sm">{e.l10}</td>
                              {/* Streak cell gets a green or red class based on W or L */}
                              <td className={`st-streak st-streak--${e.streak.startsWith("W")?"w":"l"}`}>{e.streak}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── College Top 25 rankings view ────────────────────────────────────────────
  return (
    <div className="standings-page">
      <div className="rankings-header">
        <h2 className="section-title">D1Baseball Top 25</h2>
        <p className="section-sub">Current Week Rankings</p>
      </div>
      <div className="rankings-list">
        {rankings.map(r => (
          // Each row has a left border in the team's primary color
          <div key={r.rank} className="ranking-row" style={{ borderLeftColor: r.color ? `#${r.color}` : "#2563eb" }}>
            <span className="ranking-num">{r.rank}</span>
            {r.logo && <img src={r.logo} alt="" className="ranking-logo" />}
            <span className="ranking-name">{r.name || r.abbr}</span>
            <span className="ranking-abbr">{r.abbr}</span>
            <span className="ranking-record">{r.record}</span>
          </div>
        ))}
        {rankings.length===0 && <div className="center-message"><p>Rankings not available.</p></div>}
      </div>
    </div>
  );
}

// ─── Leaders Section ──────────────────────────────────────────────────────────
// Shows the top statistical performers for a given date.
// Includes the date navigator so users can browse different dates.

function LeadersSection({ sport, date, setDate }: { sport: Sport; date: Date; setDate: (d:Date)=>void }) {
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [loading,    setLoading]    = useState(true);

  // Re-fetch when sport or date changes
  useEffect(() => {
    setLoading(true);
    fetchTopPerformers(sport, date).then(p => { setPerformers(p); setLoading(false); });
  }, [sport, date]);

  return (
    <div className="leaders-page">
      <DateNav date={date} setDate={setDate} />
      <div className="leaders-header">
        <h2 className="section-title">Top Performers</h2>
        <p className="section-sub">{sport==="mlb"?"MLB":"College Baseball D1"} · {formatDisplayDate(date)}</p>
      </div>
      {loading ? (
        <div className="center-message"><Spinner /><p>Loading performers…</p></div>
      ) : performers.length===0 ? (
        <div className="center-message">
          <p>No performer data available for this date.</p>
          <p className="modal-empty-sub">Try a recent date with completed games.</p>
        </div>
      ) : (
        // staggerContainer makes the cards animate in one by one instead of all at once
        <motion.div
          className="leaders-grid"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {performers.map(p => {
            const tc = teamHex(p.teamColor); // Convert "001f5b" → "#001f5b"
            return (
              <motion.div
                key={p.id}
                className="leader-card"
                variants={blurSlideUp}  // This card inherits the staggered entry animation
                whileHover={cardHover}  // Spring lift on hover
              >
                {/* Card header: gradient background using team color at low opacity */}
                {/* `${tc}18` appends "18" as hex alpha (≈10% opacity) to the color */}
                <div className="leader-card__header" style={{ background: `linear-gradient(135deg, ${tc}18, ${tc}06)`, borderBottom: `2px solid ${tc}25` }}>
                  {/* Headshot with a colored ring shadow using the team's color */}
                  <div className="leader-headshot-wrap" style={{ boxShadow: `0 0 0 3px ${tc}40` }}>
                    {p.headshot
                      ? <img src={p.headshot} alt={p.name} className="leader-headshot" />
                      : <div className="leader-headshot-placeholder" aria-hidden="true"><User size={28} weight="duotone" /></div>}
                  </div>
                  <div className="leader-info">
                    <div className="leader-name">{p.shortName||p.name}</div>
                    <div className="leader-meta">
                      {p.teamLogo && <img src={p.teamLogo} alt="" className="leader-team-logo" />}
                      {/* Team abbreviation in the team's primary color */}
                      <span className="leader-team" style={{ color: tc }}>{p.teamAbbr}</span>
                      {p.position && <span className="leader-pos">{p.position}</span>}
                    </div>
                    <div className="leader-matchup">{p.matchup}</div>
                  </div>
                </div>
                {/* Stat line at the bottom of the card e.g. "3-4, HR, 2 RBI, SB" */}
                <div className="leader-stat">{p.statLine}</div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

// ─── Game Details Modal ───────────────────────────────────────────────────────
// The full-screen modal that appears when a user clicks a game card.
// Contains four tabs: Gamecast (live only), Box Score, Scoring Summary, Highlights.
// Manages its own data fetching and tab state.

// The four tab options for the modal
type DetailTab = "gamecast"|"boxscore"|"scoring"|"highlights";

function GameDetailsModal({ game, sport, onClose }: { game: Game; sport: Sport; onClose: ()=>void }) {
  const [details,   setDetails]   = useState<GameDetails|null>(null);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState<string|null>(null);
  const [teamIdx,   setTeamIdx]   = useState(0); // 0 = away, 1 = home (for the box score team toggle)
  const [liveSit,   setLiveSit]   = useState<LiveSituation|null>(null);
  // useRef creates a reference we attach to the modal div so we can focus it on open
  const modalRef = useRef<HTMLDivElement>(null);

  const isScheduled = game.status==="STATUS_SCHEDULED";
  const isLive      = game.status==="STATUS_IN_PROGRESS";
  // Gamecast tab is only relevant for live games; default to box score otherwise
  const [activeTab, setActiveTab] = useState<DetailTab>(isLive ? "gamecast" : "boxscore");

  // Fetch box score data once when the modal opens (skip if game hasn't started yet)
  useEffect(() => {
    if (isScheduled) { setLoading(false); return; }
    fetchGameDetails(sport, game.id)
      .then(d => { setDetails(d); setLoading(false); })
      .catch(() => { setLoadError("Could not load game details."); setLoading(false); });
  }, [game.id, sport, isScheduled]); // Runs once when these values are first set

  // Accessibility: move keyboard focus into the modal when it opens,
  // restore focus to where it was when the modal closes,
  // and add an Escape key listener to close the modal.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    modalRef.current?.focus(); // ?.  is "optional chaining" — safe if modalRef.current is null
    const h = (e: KeyboardEvent) => { if (e.key==="Escape") onClose(); };
    window.addEventListener("keydown", h);
    // The returned function is the "cleanup" — React calls it when this effect is removed
    return () => { window.removeEventListener("keydown", h); prev?.focus(); };
  }, [onClose]);

  // For live games: fetch the live situation immediately, then poll every 20 seconds.
  // setInterval returns an ID we use to cancel the polling when the modal closes.
  useEffect(() => {
    if (!isLive) return; // Don't poll for non-live games
    fetchLiveSituation(sport, game.id).then(setLiveSit); // Fetch immediately
    const id = setInterval(() => fetchLiveSituation(sport, game.id).then(setLiveSit), 20_000); // Then every 20s
    return () => clearInterval(id); // Cancel when modal unmounts
  }, [game.id, sport, isLive]);

  // Close the modal when the user clicks the dark backdrop (but not the modal itself)
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target===e.currentTarget) onClose(); };

  // Team colors for the header gradient and tab underlines
  const awayColor = teamHex(details?.teams[0]?.color ?? "");
  const homeColor = teamHex(details?.teams[1]?.color ?? "");
  const currentTeam = details?.teams[teamIdx];
  const currentTeamColor = teamHex(currentTeam?.color ?? "");
  // Only show the Highlights tab if there are actually highlights to show
  const showHighlightsTab = !isScheduled && (details?.highlights?.length ?? 0) > 0;

  return (
    // role="dialog" and aria-modal tell screen readers this is a modal dialog
    <div className="modal-backdrop" onClick={handleBackdrop} role="dialog" aria-modal="true" aria-label={`${game.away.name} vs ${game.home.name} game details`}>
      {/* tabIndex={-1} makes the div focusable via JS (for the .focus() call above) */}
      <div className="modal" ref={modalRef} tabIndex={-1}>

        {/* ── Modal Header — team matchup with scores ── */}
        {/* Header gradient washes each team's color in from its side of the matchup */}
        <div className="modal-header" style={{ background: `linear-gradient(135deg, ${awayColor}30 0%, #0e0e0e 42%, #0e0e0e 58%, ${homeColor}30 100%)` }}>
          <div className="modal-matchup">
            {/* Away team — left side with colored left border */}
            <div className="modal-team" style={{ borderLeft: `4px solid ${awayColor}` }}>
              {game.away.logo && <img src={game.away.logo} alt="" className="modal-team-logo" />}
              <div>
                <div className="modal-team-name">{game.away.name}</div>
                <div className="modal-team-label">Away</div>
              </div>
              {!isScheduled && (
                <AnimatedScore value={game.away.score}
                  className={`modal-score${game.away.winner?" modal-score--winner":""}`} />
              )}
            </div>

            {/* Center — shows LIVE badge, Final, or vs for scheduled games */}
            <div className="modal-center">
              {isScheduled && <span className="modal-vs">vs</span>}
              {isLive && <span className="badge badge--live">● LIVE</span>}
              {!isScheduled && !isLive && <span className="modal-final">Final</span>}
              {isLive && <span className="modal-inning">{game.statusDetail}</span>}
            </div>

            {/* Home team — right side, mirrored layout */}
            <div className="modal-team modal-team--right" style={{ borderRight: `4px solid ${homeColor}` }}>
              {!isScheduled && (
                <AnimatedScore value={game.home.score}
                  className={`modal-score${game.home.winner?" modal-score--winner":""}`} />
              )}
              <div>
                <div className="modal-team-name modal-team-name--right">{game.home.name}</div>
                <div className="modal-team-label modal-team-label--right">Home</div>
              </div>
              {game.home.logo && <img src={game.home.logo} alt="" className="modal-team-logo" />}
            </div>
          </div>
          {/* Close button — positioned absolute top-right via CSS */}
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close game details"><X size={16} weight="bold" /></button>
        </div>

        {/* ── Tab bar — only shown for non-scheduled games ── */}
        {!isScheduled && (
          <div className="modal-tabs">
            {([
               ...(isLive?[{id:"gamecast",label:"● Gamecast"}]:[]), // Gamecast only for live games
               {id:"boxscore",label:"Box Score"},
               {id:"scoring",label:"Scoring Summary"},
               ...(showHighlightsTab?[{id:"highlights",label:"Highlights"}]:[]),
             ] as {id:DetailTab;label:string}[])
              .map(tab => (
                <button type="button" key={tab.id}
                  className={`modal-tab${activeTab===tab.id?" modal-tab--active":""}`}
                  // Active tab gets the current team's color as its text and underline
                  style={activeTab===tab.id?{color:currentTeamColor,borderBottomColor:currentTeamColor}:{}}
                  onClick={() => setActiveTab(tab.id)}
                  aria-selected={activeTab===tab.id}
                  role="tab">
                  {tab.label}
                </button>
              ))}
          </div>
        )}

        {/* ── Tab content ── */}
        <div className="modal-body">
          {isScheduled ? (
            // Game hasn't started yet
            <div className="modal-empty">
              <p><Clock size={16} weight="bold" style={{ verticalAlign: "-3px", marginRight: "6px" }} aria-hidden="true" />This game hasn't started yet.</p>
              <p className="modal-empty-sub">Check back at game time for live scores and stats.</p>
            </div>
          ) : activeTab==="gamecast" ? (
            // Live diamond view — show spinner until liveSit data arrives
            liveSit
              ? <LiveDiamond sit={liveSit} />
              : <div className="modal-loading"><Spinner /></div>
          ) : loading ? (
            <div className="modal-loading"><Spinner /></div>
          ) : loadError ? (
            <div className="modal-error">{loadError}</div>
          ) : !details ? (
            <div className="modal-empty">No data available.</div>
          ) : activeTab==="highlights" ? (
            <HighlightsSection highlights={details.highlights} />
          ) : activeTab==="scoring" ? (
            details.scoringPlays.length>0 ? (
              <div className="scoring-list">
                {details.scoringPlays.map((play,i) => (
                  <div key={i} className="scoring-play">
                    <div className="scoring-play__meta">
                      <span className="scoring-play__inning">{play.inningLabel}</span>
                      <span className="scoring-play__team">
                        {play.teamLogo && <img src={play.teamLogo} alt="" className="score-logo" />}
                        {play.teamAbbr}
                      </span>
                      {/* Score after this play e.g. "LAD 3 – 1 SF" */}
                      <span className="scoring-play__scoreline">
                        {play.awayAbbr} {play.awayScore} – {play.homeScore} {play.homeAbbr}
                      </span>
                    </div>
                    <p className="scoring-play__text">{play.description}</p>
                  </div>
                ))}
              </div>
            ) : <div className="modal-empty">Scoring summary not available.</div>
          ) : (
            // Box Score tab (the default)
            <div>
              {/* ── Line score table (inning-by-inning runs) ── */}
              {details.lineScore && (
                <div className="ls-wrap">
                  <div className="table-scroll">
                    <table className="stats-table linescore-table">
                      <thead>
                        <tr>
                          {details.lineScore.headers.map((h,i) => (
                            // Apply special column classes: blank, inning numbers, R/H/E
                            <th key={i} className={i===0?"th-player":i>=details.lineScore!.rheStart?"th-rhe":"th-inning"}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {details.lineScore.rows.map((row,ri) => {
                          const color = ri===0 ? awayColor : homeColor; // Away = index 0, Home = index 1
                          return (
                            <tr key={ri}>
                              {/* Team abbreviation with colored left border */}
                              <td className="td-player" style={{ borderLeft:`3px solid ${color}`, paddingLeft:"10px" }}>{row.abbr}</td>
                              {row.cells.map((cell,ci) => (
                                <td key={ci} className={`td-center${ci>=details.lineScore!.rheStart-1?" td-rhe":""}`}>{cell}</td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Team selector toggle (Away / Home) ── */}
              <div className="team-selector">
                {details.teams.map((team,i) => {
                  const tc = teamHex(team.color);
                  const isActive = teamIdx===i;
                  return (
                    <button type="button" key={i}
                      className={`team-select-btn${isActive?" team-select-btn--active":""}`}
                      // Active button gets the team's color for its border and background
                      style={isActive?{borderColor:tc,background:`${tc}15`,color:tc}:{}}
                      onClick={() => setTeamIdx(i)}
                      aria-pressed={isActive}>
                      {team.logo && <img src={team.logo} alt="" className="btn-logo" />}
                      {team.abbr||team.name}
                    </button>
                  );
                })}
              </div>

              {/* ── Batting and pitching tables for the selected team ── */}
              {currentTeam?.statGroups.length ? (
                currentTeam.statGroups.map((group,i) => (
                  <div key={i} className="stat-group">
                    <h3 className="stat-group-header" style={{color:currentTeamColor}}>
                      {group.type==="batting"?"Batting":"Pitching"}
                    </h3>
                    {group.type==="batting"
                      ? <BattingTable  group={group} teamColor={currentTeamColor} />
                      : <PitchingTable group={group} teamColor={currentTeamColor} />}
                  </div>
                ))
              ) : (
                <div className="modal-empty">Box score not available for this team.</div>
              )}

              {/* Extra base hits, errors, and pitching decisions */}
              <GameNotes teamNotes={details.teamNotes} decision={details.pitchingDecision} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
// The root component of the entire application.
// Owns the top-level state (which sport, which section, which date, the game list)
// and renders the navigation, hero carousel, and current section content.

function App() {
  // ── Top-level state ─────────────────────────────────────────────────────────
  const [section,      setSection]      = useState<Section>("scores");           // Active section tab
  const [sport,        setSport]        = useState<Sport>("mlb");                 // Active sport (MLB is the default landing page)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());            // Date for scores/leaders
  const [games,        setGames]        = useState<Game[]>([]);                  // Games for the selected date
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gamesError,   setGamesError]   = useState<string|null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string|null>(null);       // ID of open modal game
  const [news,         setNews]         = useState<NewsItem[]>([]);              // Carousel articles
  const [tickerGames,  setTickerGames]  = useState<Game[]>([]);                  // TODAY's games for the ticker

  // Fetches the game list for the current sport and date.
  // useCallback prevents this function from being re-created on every render,
  // which is important because it's used as a dependency in the useEffect below.
  const loadGames = useCallback(async () => {
    setGamesLoading(true); setGamesError(null);
    try { setGames(await fetchGames(sport, selectedDate)); }
    catch (e) { setGamesError("Could not load scores. Please try again."); console.error(e); }
    finally { setGamesLoading(false); } // Runs whether fetch succeeded or failed
  }, [sport, selectedDate]); // Re-create this function only when sport or date changes

  // Derived: does today's slate (per the ticker) have live games right now?
  const hasLive = tickerGames.some(g => g.status === "STATUS_IN_PROGRESS");

  // Load games on mount and whenever sport or date changes.
  // If viewing today, auto-refresh — every 30s while games are live, 60s otherwise —
  // so scores update without a manual reload (the flash animation shows changes).
  useEffect(() => {
    loadGames();
    if (isToday(selectedDate)) {
      const id = setInterval(loadGames, hasLive ? 30_000 : 60_000);
      return () => clearInterval(id);            // Cancel the interval on cleanup
    }
  }, [loadGames, selectedDate, hasLive]);

  // The ticker always shows TODAY's slate regardless of which date the user is
  // browsing, so it fetches independently and polls every 30 seconds.
  useEffect(() => {
    const load = () => fetchGames(sport, new Date()).then(setTickerGames).catch(() => {});
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [sport]);

  // Reload news whenever the sport changes (MLBnews vs college news)
  useEffect(() => { fetchNews(sport).then(setNews); }, [sport]);

  // Derived values — computed from existing state, not stored separately.
  // The selected game may come from the main grid OR from a ticker chip
  // (which can show today's games while the user browses another date).
  const selectedGame = games.find(g=>g.id===selectedGameId)
                    ?? tickerGames.find(g=>g.id===selectedGameId)
                    ?? null;
  const liveCount    = games.filter(g=>g.status==="STATUS_IN_PROGRESS").length; // For the "N games live" badge
  const handleClose  = useCallback(()=>setSelectedGameId(null),[]); // Stable close handler for the modal

  return (
    // <> shorthand for React.Fragment — lets us return multiple top-level elements
    <>
      {/* ── Sticky navigation bar ── */}
      <nav className="site-nav">
        <div className="site-nav__inner">
          <span className="site-nav__brand"><Baseball size={22} weight="duotone" aria-hidden="true" /> Baseball Dashboard</span>
          {/* Sport selector buttons — D1 College, D2/D3 (disabled), MLB */}
          <div className="site-nav__tabs">
            <button type="button" className={`site-nav__tab${sport==="college-baseball"?" site-nav__tab--active":""}`}
              onClick={()=>setSport("college-baseball")} aria-pressed={sport==="college-baseball"}>
              <GraduationCap size={15} weight="bold" aria-hidden="true" /> D1 College
            </button>
            {/* D2/D3 is disabled — no public API exists for it yet */}
            <button type="button" className="site-nav__tab site-nav__tab--soon" disabled
              title="D2/D3 scores require a backend server — no public API is available" aria-disabled="true">
              <GraduationCap size={15} weight="bold" aria-hidden="true" /> D2 / D3 <span className="pill-badge">Soon</span>
            </button>
            <button type="button" className={`site-nav__tab${sport==="mlb"?" site-nav__tab--active":""}`}
              onClick={()=>setSport("mlb")} aria-pressed={sport==="mlb"}>
              <BaseballCap size={15} weight="bold" aria-hidden="true" /> MLB
            </button>
          </div>
        </div>
      </nav>

      {/* ── Live score ticker — today's slate, pinned below the nav ── */}
      <ScoreTicker games={tickerGames} onSelect={setSelectedGameId} />

      {/* ── Hero news carousel — full width, outside the centered content container ── */}
      <HeroCarousel items={news} sport={sport} />

      {/* ── Centered content container (max-width 1200px) ── */}
      <div className="app-container">

        {/* Section pills — Scores / Standings / Leaders (desktop; bottom nav on mobile) */}
        <div className="sport-pills">
          {SECTION_ITEMS.map(({ id, label, icon: Icon }) => (
            <button type="button" key={id}
              className={`sport-pill${section===id?" sport-pill--active":""}`}
              onClick={()=>setSection(id)} aria-current={section===id?"page":undefined}>
              <Icon size={14} weight="bold" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>

        {/* ── Section content with animated transitions ── */}
        {/* AnimatePresence tracks which children are entering/exiting and runs their animations */}
        {/* mode="wait" ensures the old section fully exits before the new one enters */}
        <AnimatePresence mode="wait">

        {/* ── Scores section ── */}
        {section==="scores" && (
          <motion.div key="scores"
            initial={{ opacity: 0, filter: "blur(16px)", y: 20 }}
            animate={{ opacity: 1, filter: "blur(0px)",  y: 0, transition: { duration: 0.45, ease: [0.25,0.46,0.45,0.94] } }}
            exit={{    opacity: 0, filter: "blur(8px)",  y: -10, transition: { duration: 0.25 } }}
          >
            <DateNav date={selectedDate} setDate={setSelectedDate} liveCount={liveCount} />
            <section className="scores-section">
              {gamesLoading ? (
                <div className="center-message"><Spinner /><p>Loading scores…</p></div>
              ) : gamesError ? (
                <div className="center-message center-message--error">
                  <p>{gamesError}</p>
                  <button type="button" className="retry-btn" onClick={loadGames}>Retry</button>
                </div>
              ) : games.length===0 ? (
                <div className="center-message">
                  <p className="no-games-msg">No {sport==="mlb"?"MLB":"college baseball"} games on this date.</p>
                </div>
              ) : (
                // Staggered grid of game cards — each card animates in 0.09s after the previous
                <motion.div
                  className="games-grid"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {games.map(game => (
                    // When a card is clicked, store its ID — this opens the modal
                    <GameCard key={game.id} game={game} onClick={()=>setSelectedGameId(game.id)} />
                  ))}
                </motion.div>
              )}
            </section>
          </motion.div>
        )}

        {/* ── Standings section ── */}
        {section==="standings" && (
          <motion.div key="standings"
            initial={{ opacity: 0, filter: "blur(16px)", y: 20 }}
            animate={{ opacity: 1, filter: "blur(0px)",  y: 0, transition: { duration: 0.45, ease: [0.25,0.46,0.45,0.94] } }}
            exit={{    opacity: 0, filter: "blur(8px)",  y: -10, transition: { duration: 0.25 } }}
          >
            <StandingsSection sport={sport} />
          </motion.div>
        )}

        {/* ── Leaders section ── */}
        {section==="leaders" && (
          <motion.div key="leaders"
            initial={{ opacity: 0, filter: "blur(16px)", y: 20 }}
            animate={{ opacity: 1, filter: "blur(0px)",  y: 0, transition: { duration: 0.45, ease: [0.25,0.46,0.45,0.94] } }}
            exit={{    opacity: 0, filter: "blur(8px)",  y: -10, transition: { duration: 0.25 } }}
          >
            <LeadersSection sport={sport} date={selectedDate} setDate={setSelectedDate} />
          </motion.div>
        )}
        </AnimatePresence>

      </div>

      {/* ── Game details modal — rendered outside the container so it overlays everything ── */}
      {/* AnimatePresence animates the modal in when selectedGame becomes non-null,
          and animates it out when selectedGame becomes null again */}
      <AnimatePresence>
        {selectedGame && (
          <motion.div
            key="modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{    opacity: 0, transition: { duration: 0.15 } }}
          >
            <GameDetailsModal game={selectedGame} sport={sport} onClose={handleClose} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile bottom navigation — fixed tab bar, hidden on desktop via CSS ── */}
      <nav className="bottom-nav" aria-label="Sections">
        {SECTION_ITEMS.map(({ id, label, icon: Icon }) => (
          <button type="button" key={id}
            className={`bottom-nav__item${section===id?" bottom-nav__item--active":""}`}
            onClick={()=>setSection(id)} aria-current={section===id?"page":undefined}>
            <Icon size={20} weight={section===id?"fill":"regular"} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}

// Export App as the default export so main.tsx can import and render it
export default App;