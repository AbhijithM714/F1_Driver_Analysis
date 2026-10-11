/**
 * Shared aggregation primitives used by driver, constructor and circuit analytics.
 * Pure functions over the indexed dataset - no UI concerns.
 */
import {
  CORE_FILES,
  Dataset,
  QualiRow,
  ResultRow,
  getDataset,
  isClassifiedStatus,
  memo,
  round1,
} from "./dataStore";

export interface PerformanceSummary {
  starts: number;
  wins: number;
  podiums: number;
  poles: number;
  points: number;
  fastestLaps: number;
  finished: number;
  dnfs: number;
  pointsFinishes: number;
  bestFinish: number | null;
  avgFinish: number | null;
  bestGrid: number | null;
  avgGrid: number | null;
  avgQualifying: number | null;
  winRate: number;
  podiumRate: number;
  poleRate: number;
  pointsFinishRate: number;
  reliabilityRate: number;
  firstYear: number | null;
  lastYear: number | null;
  seasons: number;
}

export interface SeasonPoints {
  points: number;
  position: number | null;
  wins: number | null;
  fromStandings: boolean;
}

/** chronological index of every race (used for "latest team", streaks, ordering) */
export function getRaceOrder(): Map<number, number> {
  return memo("raceOrder", CORE_FILES, () => new Map(getDataset().races.map((r, i) => [r.raceId, i])));
}

export function getQualiIndex(): { byDriver: Map<number, QualiRow[]>; byConstructor: Map<number, QualiRow[]> } {
  return memo("qualiIndex", CORE_FILES, () => {
    const ds = getDataset();
    const byDriver = new Map<number, QualiRow[]>();
    const byConstructor = new Map<number, QualiRow[]>();
    const push = (m: Map<number, QualiRow[]>, k: number, q: QualiRow) => {
      const arr = m.get(k);
      if (arr) arr.push(q);
      else m.set(k, [q]);
    };
    ds.qualifying.forEach((q) => {
      push(byDriver, q.driverId, q);
      push(byConstructor, q.constructorId, q);
    });
    return { byDriver, byConstructor };
  });
}

/** pole counts (qualifying P1, falling back to starting-grid P1 when no qualifying data exists) */
export function getPoleCounts(): { byDriver: Map<number, number>; byConstructor: Map<number, number> } {
  return memo("poleCounts", CORE_FILES, () => {
    const ds = getDataset();
    const byDriver = new Map<number, number>();
    const byConstructor = new Map<number, number>();
    ds.poleByRace.forEach((p) => {
      byDriver.set(p.driverId, (byDriver.get(p.driverId) || 0) + 1);
      byConstructor.set(p.constructorId, (byConstructor.get(p.constructorId) || 0) + 1);
    });
    return { byDriver, byConstructor };
  });
}

type FinalStandings = Map<number, Map<number, { points: number; position: number; wins: number }>>;

/** final-of-season standings indexed by raceId -> entityId */
function finalStandings(kind: "driver" | "constructor"): FinalStandings {
  return memo(`finalStandings:${kind}`, CORE_FILES, () => {
    const ds = getDataset();
    const m: FinalStandings = new Map();
    const finals = new Set(ds.finalRaceByYear.values());
    const rows = kind === "driver" ? ds.driverStandings : ds.constructorStandings;
    rows.forEach((s) => {
      if (!finals.has(s.raceId)) return;
      const id = kind === "driver" ? s.driverId! : s.constructorId!;
      let inner = m.get(s.raceId);
      if (!inner) {
        inner = new Map();
        m.set(s.raceId, inner);
      }
      inner.set(id, { points: s.points, position: s.position, wins: s.wins });
    });
    return m;
  });
}

/**
 * Per-season championship points. Uses the official final standings (which include sprint
 * points) and falls back to the sum of race-result points when no standings exist.
 */
export function seasonPoints(
  ds: Dataset,
  rows: ResultRow[],
  kind: "driver" | "constructor",
  entityId: number
): Map<number, SeasonPoints> {
  const out = new Map<number, SeasonPoints>();
  const resultSums = new Map<number, number>();
  rows.forEach((r) => {
    const y = ds.raceById.get(r.raceId)?.year;
    if (y !== undefined) resultSums.set(y, (resultSums.get(y) || 0) + r.points);
  });
  const index = finalStandings(kind);
  resultSums.forEach((sum, year) => {
    const finalRace = ds.finalRaceByYear.get(year);
    const st = finalRace !== undefined ? index.get(finalRace)?.get(entityId) : undefined;
    if (st) out.set(year, { points: st.points, position: st.position, wins: st.wins, fromStandings: true });
    else out.set(year, { points: sum, position: null, wins: null, fromStandings: false });
  });
  return out;
}

export function summarize(
  ds: Dataset,
  rows: ResultRow[],
  poles: number,
  qualiPositions: number[],
  yearPoints?: Map<number, { points: number }>
): PerformanceSummary {
  let wins = 0;
  let podiums = 0;
  let resultPoints = 0;
  let fastestLaps = 0;
  let finished = 0;
  let pointsFinishes = 0;
  let bestFinish: number | null = null;
  let bestGrid: number | null = null;
  const finishPositions: number[] = [];
  const grids: number[] = [];
  const years = new Set<number>();

  rows.forEach((r) => {
    if (r.position === 1) wins++;
    if (r.position !== null && r.position >= 1 && r.position <= 3) podiums++;
    resultPoints += r.points;
    if (r.points > 0) pointsFinishes++;
    if (r.rank === 1) fastestLaps++;
    if (isClassifiedStatus(ds.statusById.get(r.statusId))) finished++;
    if (r.position !== null) {
      finishPositions.push(r.position);
      if (bestFinish === null || r.position < bestFinish) bestFinish = r.position;
    }
    if (r.grid > 0) {
      grids.push(r.grid);
      if (bestGrid === null || r.grid < bestGrid) bestGrid = r.grid;
    }
    const y = ds.raceById.get(r.raceId)?.year;
    if (y !== undefined) years.add(y);
  });

  const starts = rows.length;
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const points = yearPoints
    ? Array.from(yearPoints.values()).reduce((acc, v) => acc + v.points, 0)
    : resultPoints;
  const sortedYears = Array.from(years).sort((a, b) => a - b);

  return {
    starts,
    wins,
    podiums,
    poles,
    points: round1(points),
    fastestLaps,
    finished,
    dnfs: starts - finished,
    pointsFinishes,
    bestFinish,
    avgFinish: finishPositions.length ? round1(sum(finishPositions) / finishPositions.length) : null,
    bestGrid,
    avgGrid: grids.length ? round1(sum(grids) / grids.length) : null,
    avgQualifying: qualiPositions.length ? round1(sum(qualiPositions) / qualiPositions.length) : null,
    winRate: starts ? round1((wins / starts) * 100) : 0,
    podiumRate: starts ? round1((podiums / starts) * 100) : 0,
    poleRate: starts ? round1((poles / starts) * 100) : 0,
    pointsFinishRate: starts ? round1((pointsFinishes / starts) * 100) : 0,
    reliabilityRate: starts ? Math.round((finished / starts) * 100) : 100,
    firstYear: sortedYears.length ? sortedYears[0] : null,
    lastYear: sortedYears.length ? sortedYears[sortedYears.length - 1] : null,
    seasons: sortedYears.length,
  };
}

export function sortChronologically(rows: ResultRow[]): ResultRow[] {
  const order = getRaceOrder();
  return [...rows].sort((a, b) => (order.get(a.raceId) ?? 0) - (order.get(b.raceId) ?? 0));
}

export { hashColor } from "@/lib/f1Themes";
