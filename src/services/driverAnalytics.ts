/**
 * Driver analytics service
 * ------------------------
 * calculateDriverCareerStats()      full career profile
 * calculateDriverSeasonPerformance() season-by-season table
 * compareDrivers()                   side-by-side + head-to-head
 * getDriverSummaries()               light-weight roster aggregates (list pages, filters, search)
 *
 * Every number is derived from results.csv / qualifying.csv / driver_standings.csv.
 */
import {
  CORE_FILES,
  DriverRow,
  ResultRow,
  getDataset,
  isClassifiedStatus,
  memo,
  round1,
} from "./dataStore";
import {
  PerformanceSummary,
  getPoleCounts,
  getQualiIndex,
  getRaceOrder,
  seasonPoints,
  sortChronologically,
  summarize,
} from "./aggregates";
import { getTeamColor } from "@/lib/f1Themes";
import { flagForNationality } from "@/lib/flags";

export interface DriverSummary {
  driver: DriverRow;
  stats: PerformanceSummary;
  titles: number;
  titleYears: number[];
  latestConstructorId: number | null;
  latestNumber: number | null;
  isActive: boolean;
  seasons: number[];
}

function titleYearsFor(driverId: number): number[] {
  const ds = getDataset();
  const years: number[] = [];
  ds.driverChampionByYear.forEach((id, year) => {
    if (id === driverId) years.push(year);
  });
  return years.sort((a, b) => a - b);
}

/** Aggregates for every driver in one pass - cached until a source CSV changes. */
export function getDriverSummaries(): DriverSummary[] {
  return memo("driverSummaries_v2", CORE_FILES, () => {
    const ds = getDataset();
    const poles = getPoleCounts().byDriver;
    const qualiIdx = getQualiIndex().byDriver;
    const order = getRaceOrder();

    return ds.drivers.map((driver) => {
      const rows = ds.resultsByDriver.get(driver.driverId) || [];
      const qualiPositions = (qualiIdx.get(driver.driverId) || []).map((q) => q.position);
      const yearPts = seasonPoints(ds, rows, "driver", driver.driverId);
      const stats = summarize(ds, rows, poles.get(driver.driverId) || 0, qualiPositions, yearPts);

      let latest: ResultRow | null = null;
      for (const r of rows) {
        if (!latest || (order.get(r.raceId) ?? 0) > (order.get(latest.raceId) ?? 0)) latest = r;
      }
      const titleYears = titleYearsFor(driver.driverId);
      const competedYears = Array.from(
        new Set(rows.map((r) => ds.raceById.get(r.raceId)?.year).filter((y): y is number => typeof y === "number"))
      ).sort((a, b) => b - a);

      return {
        driver,
        stats,
        titles: titleYears.length,
        titleYears,
        latestConstructorId: latest ? latest.constructorId : null,
        latestNumber: latest ? latest.number : null,
        isActive: stats.lastYear === ds.latestYear,
        seasons: competedYears,
      };
    });
  });
}

export function getDriverSummary(driverId: number): DriverSummary | null {
  return getDriverSummaries().find((s) => s.driver.driverId === driverId) || null;
}

/** Reference maxima (drivers with >= 20 starts) so radar axes are real, comparable ratios */
function radarReference() {
  return memo("radarReference", CORE_FILES, () => {
    const eligible = getDriverSummaries().filter((s) => s.stats.starts >= 20);
    const max = (f: (s: DriverSummary) => number) => Math.max(1, ...eligible.map(f));
    return {
      winRate: max((s) => s.stats.winRate),
      podiumRate: max((s) => s.stats.podiumRate),
      poleRate: max((s) => s.stats.poleRate),
      pointsFinishRate: max((s) => s.stats.pointsFinishRate),
    };
  });
}

export interface RadarAxis {
  key: string;
  label: string;
  value: number; // 0-100 normalised
  raw: number; // percentage actually measured
  description: string;
}

function buildRadar(stats: PerformanceSummary): RadarAxis[] {
  const ref = radarReference();
  const norm = (v: number, m: number) => Math.min(100, Math.round((v / m) * 100));
  return [
    { key: "winRate", label: "Win Rate", value: norm(stats.winRate, ref.winRate), raw: stats.winRate, description: "Wins per start, scaled to the best win rate in the dataset (min. 20 starts)" },
    { key: "podiumRate", label: "Podium Rate", value: norm(stats.podiumRate, ref.podiumRate), raw: stats.podiumRate, description: "Podiums per start, scaled to the best podium rate in the dataset" },
    { key: "poleRate", label: "Pole Rate", value: norm(stats.poleRate, ref.poleRate), raw: stats.poleRate, description: "Pole positions per start, scaled to the best pole rate in the dataset" },
    { key: "pointsFinishRate", label: "Consistency", value: norm(stats.pointsFinishRate, ref.pointsFinishRate), raw: stats.pointsFinishRate, description: "Share of starts that scored points, scaled to the dataset best" },
    { key: "reliability", label: "Reliability", value: stats.reliabilityRate, raw: stats.reliabilityRate, description: "Share of starts that were classified finishers" },
  ];
}

export function resolveDriver(idOrRef: string | number): DriverRow | null {
  const ds = getDataset();
  if (typeof idOrRef === "number" || /^\d+$/.test(String(idOrRef))) {
    return ds.driverById.get(Number(idOrRef)) || null;
  }
  const key = String(idOrRef).toLowerCase().trim();
  return (
    ds.driverByRef.get(key) ||
    ds.drivers.find(
      (d) =>
        (d.code && d.code.toLowerCase() === key) ||
        d.fullName.toLowerCase() === key
    ) ||
    null
  );
}

const fmt1 = (n: number | null) => (n === null ? "--" : n.toFixed(1));

export function calculateDriverCareerStats(driverIdOrRef: number | string) {
  const driver = resolveDriver(driverIdOrRef);
  if (!driver) return null;
  const driverId = driver.driverId;
  const ds = getDataset();

  const rows = sortChronologically(ds.resultsByDriver.get(driverId) || []);
  const poles = getPoleCounts().byDriver.get(driverId) || 0;
  const qualiRows = getQualiIndex().byDriver.get(driverId) || [];
  const yearPts = seasonPoints(ds, rows, "driver", driverId);
  const s = summarize(ds, rows, poles, qualiRows.map((q) => q.position), yearPts);
  const titleYears = titleYearsFor(driverId);

  const pointsByYear = Array.from(yearPts.entries())
    .map(([year, v]) => ({ year, points: round1(v.points) }))
    .sort((a, b) => a.year - b.year);

  const standingsByYear = Array.from(yearPts.entries())
    .map(([year, v]) => ({
      year,
      position: v.position,
      points: round1(v.points),
      wins: v.wins,
    }))
    .sort((a, b) => a.year - b.year);
  const bestChampionshipFinish = standingsByYear.reduce<number | null>(
    (best, y) => (y.position !== null && (best === null || y.position < best) ? y.position : best),
    null
  );

  // finishing-position distribution (consistency chart)
  const bins: Record<string, number> = { P1: 0, P2: 0, P3: 0, "P4-5": 0, "P6-10": 0, "P11+": 0, DNF: 0 };
  rows.forEach((r) => {
    const ok = isClassifiedStatus(ds.statusById.get(r.statusId));
    if (!ok || r.position === null) bins.DNF++;
    else if (r.position === 1) bins.P1++;
    else if (r.position === 2) bins.P2++;
    else if (r.position === 3) bins.P3++;
    else if (r.position <= 5) bins["P4-5"]++;
    else if (r.position <= 10) bins["P6-10"]++;
    else bins["P11+"]++;
  });

  // constructors driven for
  const teamMap = new Map<number, { starts: number; wins: number; first: number; last: number }>();
  rows.forEach((r) => {
    const y = ds.raceById.get(r.raceId)?.year ?? 0;
    const t = teamMap.get(r.constructorId) || { starts: 0, wins: 0, first: y, last: y };
    t.starts++;
    if (r.position === 1) t.wins++;
    t.first = Math.min(t.first, y);
    t.last = Math.max(t.last, y);
    teamMap.set(r.constructorId, t);
  });
  const teams = Array.from(teamMap.entries())
    .map(([cid, t]) => {
      const c = ds.constructorById.get(cid);
      return {
        constructorId: cid,
        constructorRef: c?.constructorRef || "",
        name: c?.name || `Constructor ${cid}`,
        color: getTeamColor(c?.constructorRef),
        starts: t.starts,
        wins: t.wins,
        firstYear: t.first,
        lastYear: t.last,
      };
    })
    .sort((a, b) => b.starts - a.starts);

  const recentRaces = rows
    .slice(-10)
    .reverse()
    .map((r) => {
      const race = ds.raceById.get(r.raceId);
      const team = ds.constructorById.get(r.constructorId);
      const circuit = race ? ds.circuitById.get(race.circuitId) : undefined;
      return {
        resultId: r.resultId,
        raceId: r.raceId,
        year: race?.year || 0,
        round: race?.round || 0,
        raceName: race?.name || `Race ${r.raceId}`,
        circuitName: circuit?.name || "",
        date: race?.date || "",
        grid: r.grid,
        position: r.position !== null ? r.position : r.positionText,
        points: r.points,
        status: ds.statusById.get(r.statusId) || "Finished",
        constructorName: team?.name || "Constructor",
        teamColor: getTeamColor(team?.constructorRef),
      };
    });

  return {
    driver,
    driverId: driver.driverId,
    driverRef: driver.driverRef,
    code: driver.code,
    fullName: driver.fullName,
    nationality: driver.nationality,
    flag: flagForNationality(driver.nationality),
    // --- legacy keys (kept for the existing UI) ---
    totalStarts: s.starts,
    totalWins: s.wins,
    totalPodiums: s.podiums,
    totalPoles: s.poles,
    totalPoints: s.points,
    totalFastestLaps: s.fastestLaps,
    averageFinish: fmt1(s.avgFinish),
    averageGrid: fmt1(s.avgGrid),
    dnfCount: s.dnfs,
    reliabilityRate: s.reliabilityRate,
    podiumRate: s.podiumRate.toFixed(1),
    winRate: s.winRate.toFixed(1),
    bestFinish: s.bestFinish ?? "--",
    bestGrid: s.bestGrid ?? "--",
    pointsByYear,
    recentRaces,
    // --- additions ---
    titles: titleYears.length,
    titleYears,
    firstYear: s.firstYear,
    lastYear: s.lastYear,
    seasons: s.seasons,
    averageQualifying: fmt1(s.avgQualifying),
    poleRate: s.poleRate,
    pointsFinishRate: s.pointsFinishRate,
    bestChampionshipFinish,
    standingsByYear,
    positionDistribution: Object.entries(bins).map(([label, count]) => ({ label, count })),
    teams,
    radar: buildRadar(s),
    summary: s,
  };
}

export type DriverCareerStats = NonNullable<ReturnType<typeof calculateDriverCareerStats>>;

export function calculateDriverSeasonPerformance(driverId: number) {
  const ds = getDataset();
  const rows = ds.resultsByDriver.get(driverId) || [];
  const qualiIdx = getQualiIndex().byDriver.get(driverId) || [];
  const byYear = new Map<number, ResultRow[]>();
  rows.forEach((r) => {
    const y = ds.raceById.get(r.raceId)?.year;
    if (y === undefined) return;
    (byYear.get(y) || byYear.set(y, []).get(y)!).push(r);
  });
  const poleRaces = new Set<number>();
  ds.poleByRace.forEach((p, raceId) => {
    if (p.driverId === driverId) poleRaces.add(raceId);
  });
  const yearPts = seasonPoints(ds, rows, "driver", driverId);

  return Array.from(byYear.entries())
    .map(([year, yrRows]) => {
      const raceIds = new Set(yrRows.map((r) => r.raceId));
      const qPos = qualiIdx.filter((q) => raceIds.has(q.raceId)).map((q) => q.position);
      const polesInYear = yrRows.filter((r) => poleRaces.has(r.raceId)).length;
      const s = summarize(ds, yrRows, polesInYear, qPos);
      const pts = yearPts.get(year);
      const teams = Array.from(new Set(yrRows.map((r) => ds.constructorById.get(r.constructorId)?.name || "")))
        .filter(Boolean);
      return {
        year,
        teams,
        starts: s.starts,
        wins: s.wins,
        podiums: s.podiums,
        poles: s.poles,
        points: pts ? round1(pts.points) : s.points,
        championshipPosition: pts?.position ?? null,
        avgFinish: s.avgFinish,
        avgGrid: s.avgGrid,
        avgQualifying: s.avgQualifying,
        dnfs: s.dnfs,
        isChampion: ds.driverChampionByYear.get(year) === driverId,
      };
    })
    .sort((a, b) => a.year - b.year);
}

export function compareDrivers(aId: number, bId: number) {
  const ds = getDataset();
  const a = ds.driverById.get(aId);
  const b = ds.driverById.get(bId);
  if (!a || !b) return null;

  const statsA = calculateDriverCareerStats(aId)!;
  const statsB = calculateDriverCareerStats(bId)!;

  const rowsA = new Map((ds.resultsByDriver.get(aId) || []).map((r) => [r.raceId, r]));
  const rowsB = new Map((ds.resultsByDriver.get(bId) || []).map((r) => [r.raceId, r]));
  let shared = 0;
  let aAhead = 0;
  let bAhead = 0;
  let sameTeam = 0;
  rowsA.forEach((ra, raceId) => {
    const rb = rowsB.get(raceId);
    if (!rb) return;
    shared++;
    if (ra.constructorId === rb.constructorId) sameTeam++;
    if (ra.positionOrder < rb.positionOrder) aAhead++;
    else if (rb.positionOrder < ra.positionOrder) bAhead++;
  });

  const qA = new Map((getQualiIndex().byDriver.get(aId) || []).map((q) => [q.raceId, q.position]));
  const qB = new Map((getQualiIndex().byDriver.get(bId) || []).map((q) => [q.raceId, q.position]));
  let qShared = 0;
  let qAAhead = 0;
  let qBAhead = 0;
  qA.forEach((pa, raceId) => {
    const pb = qB.get(raceId);
    if (pb === undefined) return;
    qShared++;
    if (pa < pb) qAAhead++;
    else if (pb < pa) qBAhead++;
  });

  const identity = (d: DriverRow) => {
    const sum = getDriverSummary(d.driverId);
    const cid = sum?.latestConstructorId ?? null;
    const c = cid !== null ? ds.constructorById.get(cid) : undefined;
    return {
      driverId: d.driverId,
      driverRef: d.driverRef,
      code: d.code,
      fullName: d.fullName,
      nationality: d.nationality,
      flag: flagForNationality(d.nationality),
      number: d.number ?? sum?.latestNumber ?? null,
      constructorName: c?.name || "",
      teamColor: getTeamColor(c?.constructorRef),
    };
  };

  return {
    a: { ...identity(a), stats: statsA },
    b: { ...identity(b), stats: statsB },
    headToHead: {
      sharedRaces: shared,
      sameTeamRaces: sameTeam,
      aAheadInRace: aAhead,
      bAheadInRace: bAhead,
      sharedQualifying: qShared,
      aAheadInQualifying: qAAhead,
      bAheadInQualifying: qBAhead,
    },
  };
}

