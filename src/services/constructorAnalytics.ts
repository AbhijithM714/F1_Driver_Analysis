/**
 * Constructor analytics service
 * -----------------------------
 * calculateConstructorStats()  full constructor profile (wins, podiums, titles, reliability, pit stops, trend)
 * compareConstructors()        side-by-side + head-to-head
 * getConstructorSummaries()    roster aggregates (list page, filters, search)
 */
import { CORE_FILES, ConstructorRow, ResultRow, getDataset, memo, round1 } from "./dataStore";
import { PerformanceSummary, getPoleCounts, getQualiIndex, seasonPoints, summarize } from "./aggregates";
import { F1_TEAMS, getTeamColor } from "@/lib/f1Themes";
import { flagForNationality } from "@/lib/flags";

export interface ConstructorSummary {
  constructor: ConstructorRow;
  stats: PerformanceSummary;
  raceEntries: number;
  championships: number;
  titleYears: number[];
  isActive: boolean;
}

export function getConstructorSummaries(): ConstructorSummary[] {
  return memo("constructorSummaries", CORE_FILES, () => {
    const ds = getDataset();
    const poles = getPoleCounts().byConstructor;
    const qualiIdx = getQualiIndex().byConstructor;

    return ds.constructors.map((c) => {
      const rows = ds.resultsByConstructor.get(c.constructorId) || [];
      const qPos = (qualiIdx.get(c.constructorId) || []).map((q) => q.position);
      const yearPts = seasonPoints(ds, rows, "constructor", c.constructorId);
      const stats = summarize(ds, rows, poles.get(c.constructorId) || 0, qPos, yearPts);
      const titleYears: number[] = [];
      ds.constructorChampionByYear.forEach((id, year) => {
        if (id === c.constructorId) titleYears.push(year);
      });
      titleYears.sort((a, b) => a - b);
      return {
        constructor: c,
        stats,
        raceEntries: new Set(rows.map((r) => r.raceId)).size,
        championships: titleYears.length,
        titleYears,
        isActive: stats.lastYear === ds.latestYear,
      };
    });
  });
}

export function getConstructorSummary(constructorId: number): ConstructorSummary | null {
  return getConstructorSummaries().find((s) => s.constructor.constructorId === constructorId) || null;
}

export function resolveConstructor(idOrRef: string): ConstructorRow | null {
  const ds = getDataset();
  const key = idOrRef.toLowerCase().trim();
  if (/^\d+$/.test(key)) return ds.constructorById.get(Number(key)) || null;
  return ds.constructorByRef.get(key) || null;
}

/** pit-stop performance per constructor (median is used so red-flag stops do not skew it) */
function pitPerformance(constructorId: number) {
  const ds = getDataset();
  const rows = ds.resultsByConstructor.get(constructorId) || [];
  const carByRaceDriver = new Set(rows.map((r) => `${r.raceId}:${r.driverId}`));
  const durations: number[] = [];
  const byYear = new Map<number, number[]>();
  ds.pitStops.forEach((p) => {
    if (p.durationSeconds === null || !carByRaceDriver.has(`${p.raceId}:${p.driverId}`)) return;
    durations.push(p.durationSeconds);
    const y = ds.raceById.get(p.raceId)?.year;
    if (y !== undefined) (byYear.get(y) || byYear.set(y, []).get(y)!).push(p.durationSeconds);
  });
  const median = (a: number[]) => {
    if (!a.length) return null;
    const s = [...a].sort((x, y) => x - y);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  };
  const med = median(durations);
  return {
    stops: durations.length,
    medianSeconds: med === null ? null : Math.round(med * 1000) / 1000,
    fastestSeconds: durations.length ? Math.min(...durations) : null,
    byYear: Array.from(byYear.entries())
      .map(([year, d]) => ({ year, stops: d.length, medianSeconds: Math.round((median(d) as number) * 1000) / 1000 }))
      .sort((a, b) => a.year - b.year),
    available: durations.length > 0,
  };
}

export function constructorIdentity(c: ConstructorRow) {
  const meta = F1_TEAMS[c.constructorRef];
  return {
    constructorId: c.constructorId,
    constructorRef: c.constructorRef,
    name: c.name,
    nationality: c.nationality,
    flag: flagForNationality(c.nationality),
    url: c.url,
    color: getTeamColor(c.constructorRef),
    accentColor: meta?.accentColor || "#E10600",
  };
}

export function calculateConstructorStats(constructorIdOrRef: number | string) {
  const ds = getDataset();
  const c = typeof constructorIdOrRef === "number" ? ds.constructorById.get(constructorIdOrRef) : resolveConstructor(constructorIdOrRef);
  if (!c) return null;
  const constructorId = c.constructorId;
  const sum = getConstructorSummary(constructorId);
  if (!sum) return null;

  const rows = ds.resultsByConstructor.get(constructorId) || [];
  const yearPts = seasonPoints(ds, rows, "constructor", constructorId);

  // season-by-season development trend
  const byYear = new Map<number, ResultRow[]>();
  rows.forEach((r) => {
    const y = ds.raceById.get(r.raceId)?.year;
    if (y !== undefined) (byYear.get(y) || byYear.set(y, []).get(y)!).push(r);
  });
  const qualiIdx = getQualiIndex().byConstructor.get(constructorId) || [];
  const poleRaces = new Set<number>();
  ds.poleByRace.forEach((p, raceId) => {
    if (p.constructorId === constructorId) poleRaces.add(raceId);
  });

  const seasons = Array.from(byYear.entries())
    .map(([year, yrRows]) => {
      const raceIds = new Set(yrRows.map((r) => r.raceId));
      const qPos = qualiIdx.filter((q) => raceIds.has(q.raceId)).map((q) => q.position);
      const polesInYear = Array.from(raceIds).filter((id) => poleRaces.has(id)).length;
      const s = summarize(ds, yrRows, polesInYear, qPos);
      const pts = yearPts.get(year);
      return {
        year,
        races: raceIds.size,
        starts: s.starts,
        wins: s.wins,
        podiums: s.podiums,
        poles: s.poles,
        points: pts ? round1(pts.points) : s.points,
        championshipPosition: pts?.position ?? null,
        avgFinish: s.avgFinish,
        dnfs: s.dnfs,
        reliabilityRate: s.reliabilityRate,
        isChampion: ds.constructorChampionByYear.get(year) === constructorId,
      };
    })
    .sort((a, b) => a.year - b.year);

  // drivers who raced for the team
  const driverMap = new Map<number, { starts: number; wins: number; points: number; first: number; last: number }>();
  rows.forEach((r) => {
    const y = ds.raceById.get(r.raceId)?.year ?? 0;
    const d = driverMap.get(r.driverId) || { starts: 0, wins: 0, points: 0, first: y, last: y };
    d.starts++;
    if (r.position === 1) d.wins++;
    d.points += r.points;
    d.first = Math.min(d.first, y);
    d.last = Math.max(d.last, y);
    driverMap.set(r.driverId, d);
  });
  const drivers = Array.from(driverMap.entries())
    .map(([id, d]) => {
      const dr = ds.driverById.get(id);
      return {
        driverId: id,
        driverRef: dr?.driverRef || "",
        code: dr?.code || "",
        fullName: dr?.fullName || `Driver ${id}`,
        name: dr?.fullName || `Driver ${id}`,
        flag: flagForNationality(dr?.nationality),
        starts: d.starts,
        wins: d.wins,
        points: round1(d.points),
        firstYear: d.first,
        lastYear: d.last,
      };
    })
    .sort((a, b) => b.starts - a.starts);

  const latestYear = sum.stats.lastYear;
  const currentDrivers = drivers.filter((d) => d.lastYear === latestYear).slice(0, 4);

  const s = sum.stats;
  return {
    ...constructorIdentity(c),
    // --- legacy keys used by the existing UI ---
    totalWins: s.wins,
    totalPodiums: s.podiums,
    totalPoints: s.points,
    totalStarts: s.starts,
    totalDnfs: s.dnfs,
    reliabilityScore: s.reliabilityRate,
    isCurrentGrid: sum.isActive,
    // --- additions ---
    isActive: sum.isActive,
    championships: sum.championships,
    titleYears: sum.titleYears,
    raceEntries: sum.raceEntries,
    totalPoles: s.poles,
    firstYear: s.firstYear,
    lastYear: s.lastYear,
    seasonsCompeted: s.seasons,
    averageFinish: s.avgFinish,
    bestFinish: s.bestFinish,
    winRate: s.winRate,
    podiumRate: s.podiumRate,
    fastestLaps: s.fastestLaps,
    driverCount: drivers.length,
    drivers: drivers.slice(0, 25),
    currentDrivers,
    seasons,
    pitStops: pitPerformance(constructorId),
    summary: s,
  };
}

export type ConstructorStats = NonNullable<ReturnType<typeof calculateConstructorStats>>;

export function compareConstructors(aId: number, bId: number) {
  const ds = getDataset();
  const a = calculateConstructorStats(aId);
  const b = calculateConstructorStats(bId);
  if (!a || !b) return null;

  const bestByRace = (id: number) => {
    const m = new Map<number, number>();
    (ds.resultsByConstructor.get(id) || []).forEach((r) => {
      const cur = m.get(r.raceId);
      if (cur === undefined || r.positionOrder < cur) m.set(r.raceId, r.positionOrder);
    });
    return m;
  };
  const ma = bestByRace(aId);
  const mb = bestByRace(bId);
  let shared = 0;
  let aAhead = 0;
  let bAhead = 0;
  ma.forEach((pa, raceId) => {
    const pb = mb.get(raceId);
    if (pb === undefined) return;
    shared++;
    if (pa < pb) aAhead++;
    else if (pb < pa) bAhead++;
  });

  const yearsA = new Set(a.seasons.map((s) => s.year));
  const sharedSeasons = b.seasons.filter((s) => yearsA.has(s.year)).map((s) => s.year);

  return {
    a,
    b,
    headToHead: {
      sharedRaces: shared,
      aAheadInRace: aAhead,
      bAheadInRace: bAhead,
      sharedSeasons: sharedSeasons.length,
    },
  };
}

