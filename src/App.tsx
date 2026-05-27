import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type Sport = "college-baseball" | "mlb";
type Section = "scores" | "standings" | "leaders";

interface Team {
  name: string; abbreviation: string; score: string; logo: string; winner: boolean;
}
interface Game {
  id: string; home: Team; away: Team; status: string; statusDetail: string;
}
interface LineScoreData {
  headers: string[]; rows: { abbr: string; cells: string[] }[]; rheStart: number;
}
interface PlayerRow {
  name: string; stats: string[]; note?: string;
  batOrder?: number; position?: string; isSub?: boolean;
}
interface StatGroup {
  type: "batting" | "pitching"; headers: string[]; rows: PlayerRow[]; totals?: string[];
}
interface TeamBoxScore {
  name: string; abbr: string; logo: string; color: string; altColor: string; statGroups: StatGroup[];
}
interface TeamNotes {
  teamAbbr: string; doubles: string; triples: string; homeRuns: string; errors: string;
}
interface PitchingDecision { winner?: string; loser?: string; save?: string; }
interface ScoringPlay {
  inningLabel: string; teamAbbr: string; teamLogo: string; description: string;
  awayScore: number; homeScore: number; awayAbbr: string; homeAbbr: string;
}
interface Highlight { id: string; headline: string; thumbnail: string; href: string; }
interface GameDetails {
  lineScore: LineScoreData | null; teams: [TeamBoxScore, TeamBoxScore];
  scoringPlays: ScoringPlay[]; teamNotes: [TeamNotes, TeamNotes];
  pitchingDecision: PitchingDecision; highlights: Highlight[];
}

// ── New types ──────────────────────────────────────────────────────────────────
interface NewsItem {
  id: string; headline: string; description: string;
  imageUrl: string; href: string; category: string;
}
interface StandingsEntry {
  abbr: string; name: string; logo: string;
  wins: string; losses: string; pct: string; gb: string;
  home: string; away: string; streak: string; l10: string;
}
interface StandingsGroup { league: string; division: string; entries: StandingsEntry[]; }
interface RankingEntry { rank: number; abbr: string; name: string; logo: string; color: string; record: string; }
interface Performer {
  id: string; name: string; shortName: string; headshot: string; position: string;
  teamAbbr: string; teamLogo: string; teamColor: string;
  statLine: string; rating: number; matchup: string;
}
interface LiveFielder { pos: string; name: string; }
interface LiveSituation {
  balls: number; strikes: number; outs: number;
  onFirst: boolean; onSecond: boolean; onThird: boolean;
  batterName: string; pitcherName: string; inningLabel: string;
  fielders: LiveFielder[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BATTING_COLS  = ["AB","R","H","RBI","HR","BB","K","AVG"];
const PITCHING_COLS = ["IP","H","R","ER","BB","K","HR","ERA"];
const CURRENT_YEAR  = new Date().getFullYear();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toESPNDate(d: Date) {
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
}
function formatDisplayDate(d: Date) {
  return d.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
}
function isToday(d: Date) { return d.toDateString() === new Date().toDateString(); }
function shiftDay(d: Date, delta: number) { const n=new Date(d); n.setDate(n.getDate()+delta); return n; }
function teamHex(color: string, fallback="2563eb") { return color ? `#${color}` : `#${fallback}`; }

// ─── ESPN API ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchGames(sport: Sport, date: Date): Promise<Game[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/${sport}/scoreboard?dates=${toESPNDate(date)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.events ?? []).map((event: any): Game => {
    const comp = event.competitions[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapSide = (side: "home"|"away"): Team => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c = comp.competitors.find((x: any) => x.homeAway === side);
      return { name: c.team.displayName??c.team.name, abbreviation: c.team.abbreviation??"",
               score: c.score??"", logo: c.team.logo??"", winner: c.winner??false };
    };
    return { id: event.id, home: mapSide("home"), away: mapSide("away"),
             status: comp.status.type.name,
             statusDetail: comp.status.type.shortDetail??comp.status.type.detail??comp.status.type.description };
  });
}

async function fetchNews(sport: Sport): Promise<NewsItem[]> {
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/baseball/${sport}/news?limit=10`);
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.articles ?? []).filter((a: any) => a.images?.[0]?.url).slice(0,8).map((a: any) => ({
      id: String(a.dataSourceIdentifier ?? a.id ?? Math.random()),
      headline: a.headline ?? "",
      description: (a.description ?? "").replace(/<[^>]*>/g,"").slice(0,180),
      imageUrl: a.images[0].url,
      href: a.links?.web?.href ?? "",
      category: a.categories?.[0]?.description ?? "",
    }));
  } catch { return []; }
}

async function fetchMLBStandings(): Promise<StandingsGroup[]> {
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/v2/sports/baseball/mlb/standings?season=${CURRENT_YEAR}&seasontype=2&type=0&level=3`
    );
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    const groups: StandingsGroup[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const league of data.children ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const div of league.children ?? []) {
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

async function fetchCollegeRankings(): Promise<RankingEntry[]> {
  try {
    const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/rankings");
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    const poll = (data.rankings ?? [])[0];
    if (!poll) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (poll.ranks ?? []).slice(0,25).map((r: any) => {
      const t = r.team ?? {};
      return { rank: r.current??0, abbr: t.abbreviation??"",
               name: t.displayName || (`${t.location ?? ""} ${t.name ?? ""}`).trim() || (t.abbreviation ?? ""),
               logo: t.logos?.[0]?.href??"", color: t.color??"", record: r.recordSummary??"" };
    });
  } catch { return []; }
}

async function fetchTopPerformers(sport: Sport, date: Date): Promise<Performer[]> {
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/baseball/${sport}/scoreboard?dates=${toESPNDate(date)}`
    );
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    const performers: Performer[] = [];
    const seen = new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const event of data.events ?? []) {
      const comp = event.competitions?.[0];
      if (!comp) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const teamById = new Map<string,any>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const c of comp.competitors ?? []) teamById.set(String(c.team?.id??""), c.team??{});
      const matchup = event.shortName ?? "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const cat of comp.leaders ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const l of cat.leaders ?? []) {
          const athlete = l.athlete;
          if (!athlete) continue;
          const id = String(athlete.id);
          if (seen.has(id)) continue;
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
    return performers.sort((a,b) => b.rating - a.rating).slice(0,12);
  } catch { return []; }
}

async function fetchLiveSituation(sport: Sport, eventId: string): Promise<LiveSituation | null> {
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/baseball/${sport}/summary?event=${eventId}`);
    if (!res.ok) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    const sit = data.situation ?? {};

    // Build athlete ID → shortName map from rosters + boxscore pitchers
    const athleteById = new Map<string, string>();
    const fielders: LiveFielder[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const roster of data.rosters ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const entry of roster.roster ?? []) {
        const a = entry.athlete ?? {};
        const id = String(a.id ?? "");
        const sn = a.shortName ?? a.displayName ?? "";
        athleteById.set(id, sn);
        const pos: string = entry.position?.abbreviation ?? "";
        // Starters on the field (exclude DH)
        if (entry.active && entry.starter && pos && pos !== "DH") {
          fielders.push({ pos, name: sn });
        }
      }
    }
    // Index boxscore pitchers (current pitcher may not be a starter)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const entry of data.boxscore?.players ?? []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pitchSg = (entry.statistics ?? []).find((sg: any) => (sg.names ?? []).includes("IP"));
      if (!pitchSg) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const a of pitchSg.athletes ?? []) {
        const id = String(a.athlete?.id ?? "");
        if (!athleteById.has(id)) athleteById.set(id, a.athlete?.shortName ?? "");
      }
    }

    // Current runners from the last play-result
    let onFirst = false, onSecond = false, onThird = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plays: any[] = data.plays ?? [];
    for (let i = plays.length - 1; i >= 0; i--) {
      if (plays[i].type?.type === "play-result") {
        onFirst  = Boolean(plays[i].onFirst);
        onSecond = Boolean(plays[i].onSecond);
        onThird  = Boolean(plays[i].onThird);
        break;
      }
    }

    // Inning label from the most recent play that has period info
    let inningLabel = "";
    for (let i = plays.length - 1; i >= 0; i--) {
      const p = plays[i];
      if (p.period?.number) {
        const side = p.period.type === "Top" ? "▲" : "▼";
        inningLabel = `${side} ${p.period.number}`;
        break;
      }
    }

    return {
      balls: sit.balls ?? 0, strikes: sit.strikes ?? 0, outs: sit.outs ?? 0,
      onFirst, onSecond, onThird,
      batterName:  athleteById.get(String(sit.batter?.playerId  ?? "")) ?? "",
      pitcherName: athleteById.get(String(sit.pitcher?.playerId ?? "")) ?? "",
      inningLabel,
      fielders,
    };
  } catch { return null; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchGameDetails(sport: Sport, eventId: string): Promise<GameDetails> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/baseball/${sport}/summary?event=${eventId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN API ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const competitors: any[] = data.header?.competitions?.[0]?.competitors ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awayComp = competitors.find((c: any) => c.homeAway==="away");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeComp = competitors.find((c: any) => c.homeAway==="home");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awayLS: any[] = awayComp?.linescores ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeLS: any[] = homeComp?.linescores ?? [];
  const numInnings = Math.max(awayLS.length, homeLS.length);

  let lineScore: LineScoreData | null = null;
  if (numInnings > 0) {
    const headers = ["", ...Array.from({length:numInnings},(_,i)=>String(i+1)), "R","H","E"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const makeRow = (comp: any, ls: any[]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cells = ls.map((x: any) => x.displayValue!=null ? String(x.displayValue) : "-");
      while (cells.length < numInnings) cells.push("-");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cells.push(String(comp?.score??"-"), String(ls.reduce((s:number,x:any)=>s+(x.hits??0),0)),
                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                 String(ls.reduce((s:number,x:any)=>s+(x.errors??0),0)));
      return { abbr: comp?.team?.abbreviation??"", cells };
    };
    lineScore = { headers, rows:[makeRow(awayComp,awayLS),makeRow(homeComp,homeLS)], rheStart:numInnings+1 };
  }

  const homeAwayById = new Map<string,string>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    competitors.map((c: any) => [String(c.team.id), c.homeAway as string])
  );
  const colorById = new Map<string,{color:string;altColor:string}>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    competitors.map((c: any) => [String(c.team.id),{color:c.team.color??"",altColor:c.team.alternateColor??""}])
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pickStat = (stats: any[], idx: number) => {
    const v = stats?.[idx]; return v!=null&&v!=="" ? String(v) : "-";
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseEntry = (entry: any): Omit<TeamBoxScore,"color"|"altColor"> => {
    const statGroups: StatGroup[] = [];
    for (const sg of entry.statistics ?? []) {
      const allNames: string[] = sg.names ?? [];
      const isBatting = allNames.includes("AB");
      const isPitching = allNames.includes("IP");
      if (!isBatting && !isPitching) continue;
      const keepCols = isBatting ? BATTING_COLS : PITCHING_COLS;
      const keepIdx = keepCols.map(n=>allNames.indexOf(n)).filter(i=>i>=0);
      const usedNames = keepIdx.map(i=>allNames[i]);
      let rows: PlayerRow[];
      if (isBatting) {
        const seenOrders = new Set<number>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows = (sg.athletes??[]).filter((a:any)=>!a.didNotPlay).map((a:any)=>{
          const batOrder:number = a.batOrder??0;
          const isSub = seenOrders.has(batOrder);
          seenOrders.add(batOrder);
          const position:string = a.position?.abbreviation??a.athlete?.position?.abbreviation??"";
          return { name:a.athlete?.shortName??a.athlete?.displayName??"?",
                   stats:keepIdx.map(i=>pickStat(a.stats,i)), batOrder, position, isSub };
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows = (sg.athletes??[]).filter((a:any)=>!a.didNotPlay).map((a:any)=>{
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const decNote = (a.notes??[]).find((n:any)=>n.type==="pitchingDecision");
          return { name:a.athlete?.shortName??a.athlete?.displayName??"?",
                   stats:keepIdx.map(i=>pickStat(a.stats,i)), note:decNote?.text as string|undefined };
        });
      }
      const totals = isBatting&&sg.totals ? keepIdx.map(i=>pickStat(sg.totals,i)) : undefined;
      statGroups.push({ type:isBatting?"batting":"pitching", headers:[isBatting?"Batter":"Pitcher",...usedNames], rows, totals });
    }
    return { name:entry.team?.displayName??"", abbr:entry.team?.abbreviation??"", logo:entry.team?.logo??"", statGroups };
  };

  const emptyTeam = (): TeamBoxScore => ({name:"",abbr:"",logo:"",color:"",altColor:"",statGroups:[]});
  let awayTeam = emptyTeam(); let homeTeam = emptyTeam();
  for (const entry of data.boxscore?.players ?? []) {
    const id = String(entry.team?.id??"");
    const ha = homeAwayById.get(id);
    const colors = colorById.get(id) ?? {color:"",altColor:""};
    const parsed = {...parseEntry(entry),...colors};
    if (ha==="away") awayTeam=parsed; else if (ha==="home") homeTeam=parsed;
  }

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
      const text: string = dec.text??"";
      if (text.startsWith("W")) pitchingDecision.winner=`${name} (${text})`;
      else if (text.startsWith("L")) pitchingDecision.loser=`${name} (${text})`;
      else if (text.startsWith("S")) pitchingDecision.save=`${name} (${text})`;
    }
  }

  const awayAbbr = awayComp?.team?.abbreviation??awayTeam.abbr;
  const homeAbbr = homeComp?.team?.abbreviation??homeTeam.abbr;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compById = new Map<string,any>(competitors.map((c:any)=>[String(c.team.id),c]));
  const scoringPlays: ScoringPlay[] = (data.plays??[])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((p:any)=>p.scoringPlay)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((play:any)=>{
      const isTop = play.period?.type==="Top";
      const inningLabel = `${isTop?"Top":"Bot"} ${play.period?.number??"?"}`;
      const matchComp = play.team?.id!=null ? compById.get(String(play.team.id)) : isTop?awayComp:homeComp;
      return { inningLabel, teamAbbr:matchComp?.team?.abbreviation??(isTop?awayAbbr:homeAbbr),
               teamLogo:matchComp?.team?.logo??"", description:play.text??"",
               awayScore:play.awayScore??0, homeScore:play.homeScore??0, awayAbbr, homeAbbr };
    });

  const highlights: Highlight[] = (data.videos??[])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((v:any)=>({ id:String(v.id??Math.random()), headline:v.headline??"",
                     thumbnail:v.thumbnail??"", href:v.links?.web?.href??"" }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((h:any)=>h.href&&h.thumbnail);

  return { lineScore, teams:[awayTeam,homeTeam], scoringPlays, teamNotes, pitchingDecision, highlights };
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() { return <div className="spinner" aria-label="Loading" />; }

// ─── Hero Carousel ────────────────────────────────────────────────────────────

function HeroCarousel({ items, sport }: { items: NewsItem[]; sport: Sport }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback((items: NewsItem[]) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (items.length > 1) {
      timerRef.current = setInterval(() => setCurrent(c => (c+1) % items.length), 6000);
    }
  }, []);

  useEffect(() => { setCurrent(0); startTimer(items); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, [items, startTimer]);

  const goTo = (i: number) => { setCurrent(i); startTimer(items); };
  const prev = () => goTo((current - 1 + items.length) % items.length);
  const next = () => goTo((current + 1) % items.length);

  if (items.length === 0) {
    return (
      <div className="carousel carousel--empty">
        <div className="carousel__placeholder">
          <span className="carousel__placeholder-icon">{sport==="mlb"?"🏟️":"🎓"}</span>
          <h2 className="carousel__placeholder-title">{sport==="mlb" ? "MLB" : "College Baseball"}</h2>
          <p className="carousel__placeholder-sub">Live Scores · Box Scores · Standings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="carousel">
      {items.map((item, i) => (
        <div key={item.id}
          className={`carousel__slide${i===current ? " carousel__slide--active" : ""}`}
          style={{ backgroundImage: `url(${item.imageUrl})` }} />
      ))}
      <div className="carousel__gradient" />
      <div className="carousel__body" key={current}>
        {items[current]?.category && (
          <span className="carousel__label">{items[current].category}</span>
        )}
        <h2 className="carousel__headline">{items[current]?.headline}</h2>
        {items[current]?.description && (
          <p className="carousel__desc">{items[current].description}</p>
        )}
        {items[current]?.href && (
          <a href={items[current].href} target="_blank" rel="noopener noreferrer" className="carousel__cta">
            Read more →
          </a>
        )}
      </div>
      {items.length > 1 && (
        <>
          <button className="carousel__btn carousel__btn--prev" onClick={prev}>‹</button>
          <button className="carousel__btn carousel__btn--next" onClick={next}>›</button>
          <div className="carousel__dots">
            {items.map((_, i) => (
              <button key={i} className={`carousel__dot${i===current?" carousel__dot--active":""}`} onClick={() => goTo(i)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Date Nav ─────────────────────────────────────────────────────────────────

function DateNav({ date, setDate, liveCount }: { date: Date; setDate: (d: Date) => void; liveCount?: number }) {
  return (
    <div className="date-nav">
      <button className="date-nav__arrow" onClick={() => setDate(shiftDay(date,-1))}>‹</button>
      <div className="date-nav__center">
        <p className="date-nav__label">{formatDisplayDate(date)}</p>
        {!isToday(date) ? (
          <button className="today-btn" onClick={() => setDate(new Date())}>Back to Today</button>
        ) : (liveCount ?? 0) > 0 ? (
          <span className="live-count">{liveCount} game{liveCount!>1?"s":""} live</span>
        ) : null}
      </div>
      <button className="date-nav__arrow" onClick={() => setDate(shiftDay(date,1))}>›</button>
    </div>
  );
}

// ─── Game Card ────────────────────────────────────────────────────────────────

function GameCard({ game, onClick }: { game: Game; onClick: () => void }) {
  const isFinal = game.status==="STATUS_FINAL";
  const isLive  = game.status==="STATUS_IN_PROGRESS";
  return (
    <button className={`game-card${isLive?" game-card--live":""}`} onClick={onClick}>
      <div className="game-card__status">
        {isLive  && <span className="badge badge--live">● LIVE</span>}
        {isFinal && <span className="badge badge--final">Final</span>}
        {!isLive && !isFinal && <span className="badge badge--scheduled">{game.statusDetail}</span>}
        {isLive  && <span className="game-card__inning">{game.statusDetail}</span>}
      </div>
      {(["away","home"] as const).map(side => {
        const t = game[side];
        return (
          <div key={side} className={`team-row${t.winner?" team-row--winner":""}`}>
            {t.logo ? <img src={t.logo} alt="" className="team-logo" /> : <div className="team-logo team-logo--placeholder">⚾</div>}
            <span className="team-name">{t.name}</span>
            {!game.status.includes("SCHEDULED") && <span className={`score${t.winner?" score--bold":""}`}>{t.score}</span>}
          </div>
        );
      })}
      <div className="game-card__cta">View details →</div>
    </button>
  );
}

// ─── Batting Table ────────────────────────────────────────────────────────────

function BattingTable({ group, teamColor }: { group: StatGroup; teamColor: string }) {
  return (
    <div className="table-scroll">
      <table className="stats-table">
        <thead>
          <tr style={{ borderBottom: `2px solid ${teamColor}40` }}>
            <th className="th-order">#</th>
            <th className="th-pos">Pos</th>
            {group.headers.map((h,i) => <th key={i} className={i===0?"th-player":"th-stat"}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {group.rows.map((row,i) => (
            <tr key={i} className={row.isSub?"sub-row":""}>
              <td className="td-order" style={{color:teamColor}}>{row.isSub?"":row.batOrder}</td>
              <td className="td-pos">{row.position}</td>
              <td className={`td-player${row.isSub?" td-player--sub":""}`}>{row.name}</td>
              {row.stats.map((s,j) => <td key={j} className="td-center">{s}</td>)}
            </tr>
          ))}
          {group.totals && (
            <tr className="totals-row">
              <td /><td />
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
                {row.note && (
                  <span className={`decision-badge decision-badge--${row.note.startsWith("W")?"w":row.note.startsWith("L")?"l":"s"}`}>
                    {" "}{row.note.split(",")[0]}
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

function GameNotes({ teamNotes, decision }: { teamNotes: [TeamNotes,TeamNotes]; decision: PitchingDecision }) {
  const hasXBH = teamNotes.some(n=>n.doubles||n.triples||n.homeRuns);
  const hasErrors = teamNotes.some(n=>n.errors);
  const hasDec = decision.winner||decision.loser||decision.save;
  if (!hasXBH && !hasErrors && !hasDec) return null;
  return (
    <div className="game-notes">
      {hasXBH && (
        <div className="notes-block">
          <h4 className="notes-title">Extra Base Hits</h4>
          {teamNotes.map((n,i) => (n.doubles||n.triples||n.homeRuns) && (
            <div key={i} className="notes-team-row">
              <span className="notes-abbr">{n.teamAbbr}</span>
              <div className="notes-items">
                {n.doubles && <span className="notes-item"><span className="notes-label">2B</span> {n.doubles}</span>}
                {n.triples && <span className="notes-item"><span className="notes-label">3B</span> {n.triples}</span>}
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

function HighlightsSection({ highlights }: { highlights: Highlight[] }) {
  if (highlights.length===0) return <div className="modal-empty">No highlights available for this game.</div>;
  return (
    <div className="highlights-grid">
      {highlights.map(h => (
        <a key={h.id} href={h.href} target="_blank" rel="noopener noreferrer" className="highlight-card">
          <div className="highlight-thumb-wrap">
            <img src={h.thumbnail} alt="" className="highlight-thumb" />
            <div className="highlight-play">▶</div>
          </div>
          <p className="highlight-headline">{h.headline}</p>
        </a>
      ))}
    </div>
  );
}

// ─── Live Diamond ─────────────────────────────────────────────────────────────

// SVG coordinate map: position abbreviation → [cx, cy]
const FIELD_COORDS: Record<string, [number, number]> = {
  P:  [150, 149], C:  [150, 249],
  "1B": [238, 166], "2B": [193, 110], SS: [107, 110], "3B": [62, 166],
  LF: [32, 50],   CF: [150, 20],    RF: [268, 50],
};

// Truncate long names for display on the field
function truncName(n: string, max = 9) { return n.length > max ? n.slice(0, max - 1) + "…" : n; }

function LiveDiamond({ sit }: { sit: LiveSituation }) {
  // Base diamond vertices
  const HP: [number,number] = [150, 228];
  const B1: [number,number] = [228, 153];
  const B2: [number,number] = [150, 78];
  const B3: [number,number] = [72, 153];

  // Map fielders by position for quick lookup
  const fieldMap: Record<string, string> = {};
  for (const f of sit.fielders) fieldMap[f.pos] = f.name;

  const baseColor = (on: boolean) => on ? "#f97316" : "rgba(200,180,150,0.45)";
  const baseShadow = (on: boolean) => on ? "drop-shadow(0 0 5px #f97316aa)" : "none";

  // Dot indicator helper (balls=green, strikes=yellow, outs=red)
  const dots = (total: number, filled: number, color: string, emptyColor: string) =>
    Array.from({length: total}, (_, i) => (
      <circle key={i}
        cx={0} cy={0} r={5.5}
        fill={i < filled ? color : emptyColor}
        stroke="rgba(255,255,255,0.25)" strokeWidth="0.8"
        transform={`translate(${i * 15}, 0)`}
      />
    ));

  return (
    <div className="live-diamond-wrap">
      {/* ── Inning banner ── */}
      <div className="live-inning-bar">
        {sit.inningLabel && <span className="live-inning">{sit.inningLabel}</span>}
        <span className="live-badge-dot">● LIVE</span>
      </div>

      <div className="live-diamond-body">
        {/* ── SVG field ── */}
        <svg viewBox="0 0 300 270" className="diamond-svg" aria-label="Live baseball field">
          {/* Grass background */}
          <rect width={300} height={270} fill="#1e5c1e" rx={8} />

          {/* Foul lines */}
          <line x1={HP[0]} y1={HP[1]} x2={0}   y2={10} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
          <line x1={HP[0]} y1={HP[1]} x2={300}  y2={10} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />

          {/* Dirt infield polygon */}
          <polygon
            points={`${HP[0]},${HP[1]} ${B1[0]},${B1[1]} ${B2[0]},${B2[1]} ${B3[0]},${B3[1]}`}
            fill="#c8a47a"
          />

          {/* Infield grass square (slightly inset) */}
          <polygon
            points="150,215 215,153 150,91 85,153"
            fill="#2d7a2d"
          />

          {/* Pitcher's mound circle */}
          <circle cx={150} cy={149} r={12} fill="#c8a47a" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />

          {/* Base paths (white lines) */}
          {[[HP,B1],[B1,B2],[B2,B3],[B3,HP]].map(([a,b],i) => (
            <line key={i} x1={(a as [number,number])[0]} y1={(a as [number,number])[1]}
              x2={(b as [number,number])[0]} y2={(b as [number,number])[1]}
              stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} />
          ))}

          {/* ── Bases (rotated squares) ── */}
          {/* 1B */}
          <g filter={sit.onFirst ? baseShadow(true) : baseShadow(false)}>
            <rect x={B1[0]-8} y={B1[1]-8} width={16} height={16}
              fill={baseColor(sit.onFirst)} rx={1}
              transform={`rotate(45,${B1[0]},${B1[1]})`} />
          </g>
          {/* 2B */}
          <g filter={sit.onSecond ? baseShadow(true) : baseShadow(false)}>
            <rect x={B2[0]-8} y={B2[1]-8} width={16} height={16}
              fill={baseColor(sit.onSecond)} rx={1}
              transform={`rotate(45,${B2[0]},${B2[1]})`} />
          </g>
          {/* 3B */}
          <g filter={sit.onThird ? baseShadow(true) : baseShadow(false)}>
            <rect x={B3[0]-8} y={B3[1]-8} width={16} height={16}
              fill={baseColor(sit.onThird)} rx={1}
              transform={`rotate(45,${B3[0]},${B3[1]})`} />
          </g>
          {/* Home plate (pentagon) */}
          <polygon
            points={`${HP[0]},${HP[1]+9} ${HP[0]+8},${HP[1]+2} ${HP[0]+8},${HP[1]-7} ${HP[0]-8},${HP[1]-7} ${HP[0]-8},${HP[1]+2}`}
            fill="white"
          />

          {/* ── Batter boxes (outlines at plate) ── */}
          <rect x={HP[0]+8}  y={HP[1]-17} width={12} height={20} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />
          <rect x={HP[0]-20} y={HP[1]-17} width={12} height={20} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />

          {/* ── Fielder markers ── */}
          {Object.entries(FIELD_COORDS).map(([pos, [cx, cy]]) => {
            const name = fieldMap[pos] ?? "";
            const isAbove = cy < 80; // CF near top — label goes below
            return (
              <g key={pos}>
                {/* Drop shadow */}
                <circle cx={cx} cy={cy} r={14} fill="rgba(0,0,0,0.3)" transform="translate(1,1)" />
                {/* Circle fill */}
                <circle cx={cx} cy={cy} r={13}
                  fill="rgba(15,40,100,0.82)"
                  stroke="rgba(255,255,255,0.65)" strokeWidth={1.5}
                />
                {/* Position abbreviation */}
                <text x={cx} y={cy+4} textAnchor="middle"
                  fontSize={pos.length > 2 ? "7.5" : "9"} fontWeight="bold"
                  fill="white" fontFamily="Inter,sans-serif">
                  {pos}
                </text>
                {/* Player name */}
                {name && (
                  <text x={cx} y={isAbove ? cy+25 : cy-18} textAnchor="middle"
                    fontSize="7.2" fill="rgba(255,255,255,0.9)"
                    fontFamily="Inter,sans-serif" fontWeight="600">
                    {truncName(name)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* ── Info panel (count + matchup) ── */}
        <div className="live-panel">
          {/* Count */}
          <div className="live-count-block">
            <div className="live-count-row">
              <span className="live-count-label">B</span>
              <svg width={45} height={12}>{dots(4, sit.balls, "#22c55e", "rgba(255,255,255,0.15)")}</svg>
            </div>
            <div className="live-count-row">
              <span className="live-count-label">S</span>
              <svg width={30} height={12}>{dots(3, sit.strikes, "#facc15", "rgba(255,255,255,0.15)")}</svg>
            </div>
            <div className="live-count-row">
              <span className="live-count-label">O</span>
              <svg width={30} height={12}>{dots(3, sit.outs, "#ef4444", "rgba(255,255,255,0.15)")}</svg>
            </div>
          </div>

          {/* Runners legend */}
          <div className="live-runners">
            {[["1B", sit.onFirst], ["2B", sit.onSecond], ["3B", sit.onThird]].map(([base, on]) => (
              <div key={String(base)} className={`live-runner-pill${on ? " live-runner-pill--on" : ""}`}>
                {String(base)}
              </div>
            ))}
          </div>

          {/* Matchup */}
          <div className="live-matchup">
            <div className="live-matchup-row">
              <span className="live-role live-role--bat">🏏 BAT</span>
              <span className="live-player-name">{sit.batterName || "—"}</span>
            </div>
            <div className="live-matchup-row">
              <span className="live-role live-role--pit">⚾ PIT</span>
              <span className="live-player-name">{sit.pitcherName || "—"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Standings Section ────────────────────────────────────────────────────────

function StandingsSection({ sport }: { sport: Sport }) {
  const [mlbGroups, setMLBGroups] = useState<StandingsGroup[]>([]);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (sport==="mlb") {
      fetchMLBStandings().then(g => { setMLBGroups(g); setLoading(false); });
    } else {
      fetchCollegeRankings().then(r => { setRankings(r); setLoading(false); });
    }
  }, [sport]);

  if (loading) return <div className="center-message"><Spinner /><p>Loading…</p></div>;

  if (sport==="mlb") {
    const leagues = ["American League","National League"];
    return (
      <div className="standings-page">
        {leagues.map(ln => {
          const divs = mlbGroups.filter(g=>g.league===ln);
          return (
            <div key={ln} className="standings-league">
              <h2 className="standings-league__name">{ln}</h2>
              <div className="standings-divisions">
                {divs.map(group => (
                  <div key={group.division} className="standings-group">
                    <div className="standings-group__div">{group.division.replace(ln+" ","")}</div>
                    <div className="table-scroll">
                      <table className="standings-table">
                        <thead>
                          <tr>
                            <th className="st-col-team">Team</th>
                            <th>W</th><th>L</th><th>PCT</th><th>GB</th>
                            <th className="st-hide-sm">Home</th>
                            <th className="st-hide-sm">Away</th>
                            <th className="st-hide-sm">L10</th>
                            <th>Str</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.entries.map((e,i) => (
                            <tr key={e.abbr} className={i===0?"st-leader-row":""}>
                              <td className="st-col-team">
                                <div className="st-team-cell">
                                  {e.logo && <img src={e.logo} alt="" className="st-logo" />}
                                  <span className="st-team-name">{e.name}</span>
                                </div>
                              </td>
                              <td>{e.wins}</td><td>{e.losses}</td><td>{e.pct}</td>
                              <td className={e.gb==="-"?"st-gb-leader":""}>{e.gb==="-"?"—":e.gb}</td>
                              <td className="st-hide-sm">{e.home}</td>
                              <td className="st-hide-sm">{e.away}</td>
                              <td className="st-hide-sm">{e.l10}</td>
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

  // College rankings
  return (
    <div className="standings-page">
      <div className="rankings-header">
        <h2 className="section-title">D1Baseball Top 25</h2>
        <p className="section-sub">Current Week Rankings</p>
      </div>
      <div className="rankings-list">
        {rankings.map(r => (
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

function LeadersSection({ sport, date, setDate }: { sport: Sport; date: Date; setDate: (d:Date)=>void }) {
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [loading, setLoading] = useState(true);

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
          <p style={{fontSize:".82rem",color:"#a0aec0",marginTop:"6px"}}>Try a recent date with completed games.</p>
        </div>
      ) : (
        <div className="leaders-grid">
          {performers.map(p => {
            const tc = teamHex(p.teamColor);
            return (
              <div key={p.id} className="leader-card">
                <div className="leader-card__header" style={{ background: `linear-gradient(135deg, ${tc}18, ${tc}06)`, borderBottom: `2px solid ${tc}25` }}>
                  <div className="leader-headshot-wrap" style={{ boxShadow: `0 0 0 3px ${tc}40` }}>
                    {p.headshot
                      ? <img src={p.headshot} alt={p.name} className="leader-headshot" />
                      : <div className="leader-headshot-placeholder">👤</div>}
                  </div>
                  <div className="leader-info">
                    <div className="leader-name">{p.shortName||p.name}</div>
                    <div className="leader-meta">
                      {p.teamLogo && <img src={p.teamLogo} alt="" className="leader-team-logo" />}
                      <span className="leader-team" style={{ color: tc }}>{p.teamAbbr}</span>
                      {p.position && <span className="leader-pos">{p.position}</span>}
                    </div>
                    <div className="leader-matchup">{p.matchup}</div>
                  </div>
                </div>
                <div className="leader-stat">{p.statLine}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Game Details Modal ───────────────────────────────────────────────────────

type DetailTab = "gamecast"|"boxscore"|"scoring"|"highlights";

function GameDetailsModal({ game, sport, onClose }: { game: Game; sport: Sport; onClose: ()=>void }) {
  const [details, setDetails]     = useState<GameDetails|null>(null);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<string|null>(null);
  const [teamIdx, setTeamIdx]     = useState(0);
  const [liveSit, setLiveSit]     = useState<LiveSituation|null>(null);

  const isScheduled = game.status==="STATUS_SCHEDULED";
  const isLive      = game.status==="STATUS_IN_PROGRESS";
  const [activeTab, setActiveTab] = useState<DetailTab>(isLive ? "gamecast" : "boxscore");

  useEffect(() => {
    if (isScheduled) { setLoading(false); return; }
    fetchGameDetails(sport, game.id)
      .then(d => { setDetails(d); setLoading(false); })
      .catch(() => { setLoadError("Could not load game details."); setLoading(false); });
  }, [game.id, sport, isScheduled]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key==="Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // Live situation: fetch immediately + poll every 20 s while game is in progress
  useEffect(() => {
    if (!isLive) return;
    fetchLiveSituation(sport, game.id).then(setLiveSit);
    const id = setInterval(() => fetchLiveSituation(sport, game.id).then(setLiveSit), 20_000);
    return () => clearInterval(id);
  }, [game.id, sport, isLive]);

  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target===e.currentTarget) onClose(); };

  const awayColor = teamHex(details?.teams[0]?.color ?? "");
  const homeColor = teamHex(details?.teams[1]?.color ?? "");
  const currentTeam = details?.teams[teamIdx];
  const currentTeamColor = teamHex(currentTeam?.color ?? "");
  const showHighlightsTab = !isScheduled && (details?.highlights?.length ?? 0) > 0;

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal">
        <div className="modal-header" style={{ background: `linear-gradient(135deg, ${awayColor}18 0%, #f8fafc 45%, ${homeColor}18 100%)` }}>
          <div className="modal-matchup">
            <div className="modal-team" style={{ borderLeft: `4px solid ${awayColor}` }}>
              {game.away.logo && <img src={game.away.logo} alt="" className="modal-team-logo" />}
              <div>
                <div className="modal-team-name">{game.away.name}</div>
                <div className="modal-team-label">Away</div>
              </div>
              {!isScheduled && (
                <span className={`modal-score${game.away.winner?" modal-score--winner":""}`}
                  style={game.away.winner?{color:awayColor}:{}}>
                  {game.away.score}
                </span>
              )}
            </div>
            <div className="modal-center">
              {isScheduled && <span className="modal-vs">vs</span>}
              {isLive && <span className="badge badge--live">● LIVE</span>}
              {!isScheduled && !isLive && <span className="modal-final">Final</span>}
              {isLive && <span className="modal-inning">{game.statusDetail}</span>}
            </div>
            <div className="modal-team modal-team--right" style={{ borderRight: `4px solid ${homeColor}` }}>
              {!isScheduled && (
                <span className={`modal-score${game.home.winner?" modal-score--winner":""}`}
                  style={game.home.winner?{color:homeColor}:{}}>
                  {game.home.score}
                </span>
              )}
              <div>
                <div className="modal-team-name modal-team-name--right">{game.home.name}</div>
                <div className="modal-team-label modal-team-label--right">Home</div>
              </div>
              {game.home.logo && <img src={game.home.logo} alt="" className="modal-team-logo" />}
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {!isScheduled && (
          <div className="modal-tabs">
            {([
               ...(isLive?[{id:"gamecast",label:"🔴 Gamecast"}]:[]),
               {id:"boxscore",label:"Box Score"},
               {id:"scoring",label:"Scoring Summary"},
               ...(showHighlightsTab?[{id:"highlights",label:"Highlights"}]:[]),
             ] as {id:DetailTab;label:string}[])
              .map(tab => (
                <button key={tab.id}
                  className={`modal-tab${activeTab===tab.id?" modal-tab--active":""}`}
                  style={activeTab===tab.id?{color:currentTeamColor,borderBottomColor:currentTeamColor}:{}}
                  onClick={() => setActiveTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
          </div>
        )}

        <div className="modal-body">
          {isScheduled ? (
            <div className="modal-empty">
              <p>⏰ This game hasn't started yet.</p>
              <p className="modal-empty-sub">Check back at game time for live scores and stats.</p>
            </div>
          ) : activeTab==="gamecast" ? (
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
            <div>
              {details.lineScore && (
                <div className="ls-wrap">
                  <div className="table-scroll">
                    <table className="stats-table linescore-table">
                      <thead>
                        <tr>
                          {details.lineScore.headers.map((h,i) => (
                            <th key={i} className={i===0?"th-player":i>=details.lineScore!.rheStart?"th-rhe":"th-inning"}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {details.lineScore.rows.map((row,ri) => {
                          const color = ri===0 ? awayColor : homeColor;
                          return (
                            <tr key={ri}>
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
              <div className="team-selector">
                {details.teams.map((team,i) => {
                  const tc = teamHex(team.color);
                  const isActive = teamIdx===i;
                  return (
                    <button key={i}
                      className={`team-select-btn${isActive?" team-select-btn--active":""}`}
                      style={isActive?{borderColor:tc,background:`${tc}15`,color:tc}:{}}
                      onClick={() => setTeamIdx(i)}>
                      {team.logo && <img src={team.logo} alt="" className="btn-logo" />}
                      {team.abbr||team.name}
                    </button>
                  );
                })}
              </div>
              {currentTeam?.statGroups.length ? (
                currentTeam.statGroups.map((group,i) => (
                  <div key={i} className="stat-group">
                    <h3 className="stat-group-header" style={{color:currentTeamColor}}>
                      {group.type==="batting"?"Batting":"Pitching"}
                    </h3>
                    {group.type==="batting"
                      ? <BattingTable group={group} teamColor={currentTeamColor} />
                      : <PitchingTable group={group} teamColor={currentTeamColor} />}
                  </div>
                ))
              ) : (
                <div className="modal-empty">Box score not available for this team.</div>
              )}
              <GameNotes teamNotes={details.teamNotes} decision={details.pitchingDecision} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [section, setSection]         = useState<Section>("scores");
  const [sport, setSport]             = useState<Sport>("college-baseball");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [games, setGames]             = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gamesError, setGamesError]   = useState<string|null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string|null>(null);
  const [news, setNews]               = useState<NewsItem[]>([]);

  const loadGames = useCallback(async () => {
    setGamesLoading(true); setGamesError(null);
    try { setGames(await fetchGames(sport, selectedDate)); }
    catch (e) { setGamesError("Could not load scores. Please try again."); console.error(e); }
    finally { setGamesLoading(false); }
  }, [sport, selectedDate]);

  useEffect(() => {
    loadGames();
    if (isToday(selectedDate)) {
      const id = setInterval(loadGames, 60_000);
      return () => clearInterval(id);
    }
  }, [loadGames, selectedDate]);

  useEffect(() => { fetchNews(sport).then(setNews); }, [sport]);

  const selectedGame = games.find(g=>g.id===selectedGameId)??null;
  const liveCount    = games.filter(g=>g.status==="STATUS_IN_PROGRESS").length;
  const handleClose  = useCallback(()=>setSelectedGameId(null),[]);

  return (
    <>
      {/* ── Sticky nav ── */}
      <nav className="site-nav">
        <div className="site-nav__inner">
          <span className="site-nav__brand">⚾ Baseball Dashboard</span>
          <div className="site-nav__tabs">
            {([["scores","📊 Scores"],["standings","🏆 Standings"],["leaders","⭐ Leaders"]] as [Section,string][]).map(([s,label])=>(
              <button key={s} className={`site-nav__tab${section===s?" site-nav__tab--active":""}`} onClick={()=>setSection(s)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Hero carousel (full width) ── */}
      <HeroCarousel items={news} sport={sport} />

      {/* ── Inner content ── */}
      <div className="app-container">

        {/* Sport pills */}
        <div className="sport-pills">
          <button className={`sport-pill${sport==="college-baseball"?" sport-pill--active":""}`}
            onClick={()=>setSport("college-baseball")}>🎓 D1 College</button>
          <button className="sport-pill sport-pill--soon" disabled
            title="D2/D3 scores require a backend server — no public API is available">
            🎓 D2 / D3 <span className="pill-badge">Soon</span>
          </button>
          <button className={`sport-pill${sport==="mlb"?" sport-pill--active":""}`}
            onClick={()=>setSport("mlb")}>🏟️ MLB</button>
        </div>

        {/* Scores */}
        {section==="scores" && (
          <>
            <DateNav date={selectedDate} setDate={setSelectedDate} liveCount={liveCount} />
            <section className="scores-section">
              {gamesLoading ? (
                <div className="center-message"><Spinner /><p>Loading scores…</p></div>
              ) : gamesError ? (
                <div className="center-message center-message--error">
                  <p>{gamesError}</p>
                  <button className="retry-btn" onClick={loadGames}>Retry</button>
                </div>
              ) : games.length===0 ? (
                <div className="center-message">
                  <p className="no-games-msg">No {sport==="mlb"?"MLB":"college baseball"} games on this date.</p>
                </div>
              ) : (
                <div className="games-grid">
                  {games.map(game => (
                    <GameCard key={game.id} game={game} onClick={()=>setSelectedGameId(game.id)} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Standings */}
        {section==="standings" && <StandingsSection sport={sport} />}

        {/* Leaders */}
        {section==="leaders" && <LeadersSection sport={sport} date={selectedDate} setDate={setSelectedDate} />}

      </div>

      {selectedGame && (
        <GameDetailsModal game={selectedGame} sport={sport} onClose={handleClose} />
      )}
    </>
  );
}

export default App;