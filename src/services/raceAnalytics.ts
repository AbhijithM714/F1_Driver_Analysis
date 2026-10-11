/**
 * Race analytics service
 * ----------------------
 * calculateRaceSummary()     classification, podium, winner, fastest lap, pit stats
 * calculateLapProgression()   lap-by-lap progression chart data
 * calculatePitStrategy()      pit stops, actual pit windows, tyre degradation from lap_times
 * calculateRaceReplay()       lap-by-lap replay simulation frames
 * getRacesList()             filtered list of Grand Prix events
 */
import {
  CORE_FILES,
  PitStopRow,
  ResultRow,
  formatLapMs,
  getDataset,
  getLapIndex,
  memo,
  readJsonFile,
  readTable,
  round1,
} from "./dataStore";
import { flagForNationality } from "@/lib/flags";
import { getTeamColor } from "@/lib/f1Themes";

export interface RaceClassificationRow {
  resultId: number;
  driverId: number;
  driverRef: string;
  driverName: string;
  code: string;
  driverNumber: number | null;
  nationality: string;
  flag: string;
  constructorId: number;
  constructorName: string;
  constructorRef: string;
  teamColor: string;
  grid: number;
  position: number | null;
  positionText: string;
  points: number;
  laps: number;
  time: string;
  milliseconds: number | null;
  fastestLap: number | null;
  fastestLapTime: string | null;
  fastestLapSpeed: number | null;
  status: string;
  gridDelta: number;
}

export interface RaceSummaryResult {
  race: {
    raceId: number;
    year: number;
    round: number;
    circuitId: number;
    circuitName: string;
    circuitRef: string;
    location: string;
    country: string;
    flag: string;
    name: string;
    date: string;
    time: string;
    url: string;
    hasSprint: boolean;
  };
  classification: RaceClassificationRow[];
  totalLaps: number;
  winner: RaceClassificationRow | null;
  podium: RaceClassificationRow[];
  fastestLap: {
    driverId: number;
    driverName: string;
    code: string;
    lap: number | null;
    time: string | null;
    speed: number | null;
  } | null;
  pitStops: {
    totalPitStops: number;
    averagePitDuration: number | null;
    fastestPitStop: {
      driverId: number;
      driverName: string;
      stop: number;
      lap: number;
      duration: number;
    } | null;
    stops: PitStopRow[];
  };
}

export function calculateRaceSummary(raceId: number): RaceSummaryResult | null {
  const ds = getDataset();
  const race = ds.raceById.get(raceId);
  if (!race) return null;

  const circuit = ds.circuitById.get(race.circuitId);
  const results = ds.resultsByRace.get(raceId) || [];

  const classification: RaceClassificationRow[] = results.map((r) => {
    const d = ds.driverById.get(r.driverId);
    const c = ds.constructorById.get(r.constructorId);
    const statusText = ds.statusById.get(r.statusId) || "Classified";

    const dName = d ? d.fullName : `Driver #${r.driverId}`;
    const dCode = d?.code || (d ? d.surname.substring(0, 3).toUpperCase() : "DRV");
    const dNat = d?.nationality || "";
    const cName = c?.name || "Constructor";
    const cRef = c?.constructorRef || "";

    const finishPos = r.position;
    const gridPos = r.grid > 0 ? r.grid : finishPos || 0;
    const delta = finishPos !== null && r.grid > 0 ? r.grid - finishPos : 0;

    return {
      resultId: r.resultId,
      driverId: r.driverId,
      driverRef: d?.driverRef || "",
      driverName: dName,
      code: dCode,
      driverNumber: r.number ?? d?.number ?? null,
      nationality: dNat,
      flag: flagForNationality(dNat),
      constructorId: r.constructorId,
      constructorName: cName,
      constructorRef: cRef,
      teamColor: getTeamColor(cRef),
      grid: r.grid,
      position: finishPos,
      positionText: r.positionText,
      points: r.points,
      laps: r.laps,
      time: r.time || (finishPos === null ? statusText : ""),
      milliseconds: r.milliseconds,
      fastestLap: r.fastestLap,
      fastestLapTime: r.fastestLapTime,
      fastestLapSpeed: r.fastestLapSpeed,
      status: statusText,
      gridDelta: delta,
    };
  });

  // Sort by positionOrder or position
  classification.sort((a, b) => {
    if (a.position === null && b.position === null) return 0;
    if (a.position === null) return 1;
    if (b.position === null) return -1;
    return a.position - b.position;
  });

  const winner = classification.find((c) => c.position === 1) || null;
  const podium = classification.filter((c) => c.position !== null && c.position >= 1 && c.position <= 3);

  // Fastest lap in this race
  let flRow = results.find((r) => r.rank === 1);
  if (!flRow) {
    // Check lap_times
    const lapIdx = getLapIndex().get(raceId);
    if (lapIdx && lapIdx.length > 0) {
      let bestIdx = -1;
      for (let i = 0; i < lapIdx.length; i++) {
        if (lapIdx.ms[i] > 0 && (bestIdx === -1 || lapIdx.ms[i] < lapIdx.ms[bestIdx])) {
          bestIdx = i;
        }
      }
      if (bestIdx >= 0) {
        const d = ds.driverById.get(lapIdx.driverId[bestIdx]);
        return {
          race: {
            raceId: race.raceId,
            year: race.year,
            round: race.round,
            circuitId: race.circuitId,
            circuitName: circuit?.name || "Grand Prix Circuit",
            circuitRef: circuit?.circuitRef || "",
            location: circuit?.location || "",
            country: circuit?.country || "",
            flag: flagForNationality(circuit?.country || ""),
            name: race.name,
            date: race.date,
            time: race.time || "",
            url: race.url,
            hasSprint: race.hasSprint,
          },
          classification,
          totalLaps: Math.max(0, ...classification.map((c) => c.laps)),
          winner,
          podium,
          fastestLap: {
            driverId: lapIdx.driverId[bestIdx],
            driverName: d?.fullName || "Driver",
            code: d?.code || "DRV",
            lap: lapIdx.lap[bestIdx],
            time: formatLapMs(lapIdx.ms[bestIdx]),
            speed: null,
          },
          pitStops: getRacePitStopStats(raceId, ds.pitStops, ds.driverById),
        };
      }
    }
  }

  const flDriver = flRow ? ds.driverById.get(flRow.driverId) : null;
  const fastestLap = flRow
    ? {
        driverId: flRow.driverId,
        driverName: flDriver?.fullName || "Driver",
        code: flDriver?.code || "DRV",
        lap: flRow.fastestLap,
        time: flRow.fastestLapTime,
        speed: flRow.fastestLapSpeed,
      }
    : null;

  return {
    race: {
      raceId: race.raceId,
      year: race.year,
      round: race.round,
      circuitId: race.circuitId,
      circuitName: circuit?.name || "Grand Prix Circuit",
      circuitRef: circuit?.circuitRef || "",
      location: circuit?.location || "",
      country: circuit?.country || "",
      flag: flagForNationality(circuit?.country || ""),
      name: race.name,
      date: race.date,
      time: race.time || "",
      url: race.url,
      hasSprint: race.hasSprint,
    },
    classification,
    totalLaps: Math.max(0, ...classification.map((c) => c.laps)),
    winner,
    podium,
    fastestLap,
    pitStops: getRacePitStopStats(raceId, ds.pitStops, ds.driverById),
  };
}

function getRacePitStopStats(raceId: number, allStops: PitStopRow[], driverById: Map<number, any>) {
  const stops = allStops.filter((p) => p.raceId === raceId);
  if (stops.length === 0) {
    return {
      totalPitStops: 0,
      averagePitDuration: null,
      fastestPitStop: null,
      stops: [],
    };
  }

  const validDurations = stops
    .map((s) => s.durationSeconds)
    .filter((d): d is number => d !== null && d > 10 && d < 60);

  const avgDuration =
    validDurations.length > 0
      ? round1(validDurations.reduce((a, b) => a + b, 0) / validDurations.length)
      : null;

  let fastest: PitStopRow | null = null;
  for (const s of stops) {
    if (s.durationSeconds && s.durationSeconds > 10 && s.durationSeconds < 60) {
      if (!fastest || (fastest.durationSeconds && s.durationSeconds < fastest.durationSeconds)) {
        fastest = s;
      }
    }
  }

  const fastestDriver = fastest ? driverById.get(fastest.driverId) : null;

  return {
    totalPitStops: stops.length,
    averagePitDuration: avgDuration,
    fastestPitStop: fastest
      ? {
          driverId: fastest.driverId,
          driverName: fastestDriver?.fullName || `Driver #${fastest.driverId}`,
          stop: fastest.stop,
          lap: fastest.lap,
          duration: fastest.durationSeconds!,
        }
      : null,
    stops,
  };
}

export function calculateLapProgression(raceId: number) {
  const ds = getDataset();
  const lapIdx = getLapIndex().get(raceId);
  if (!lapIdx || lapIdx.length === 0) {
    return { maxLaps: 0, drivers: [] };
  }

  const byDriver = new Map<number, { lap: number; position: number; time: string; ms: number }[]>();
  let maxLaps = 0;

  for (let i = 0; i < lapIdx.length; i++) {
    const dId = lapIdx.driverId[i];
    const lap = lapIdx.lap[i];
    const pos = lapIdx.position[i];
    const ms = lapIdx.ms[i];

    if (lap > maxLaps) maxLaps = lap;

    let arr = byDriver.get(dId);
    if (!arr) {
      arr = [];
      byDriver.set(dId, arr);
    }
    arr.push({
      lap,
      position: pos,
      time: formatLapMs(ms),
      ms,
    });
  }

  const drivers = [...byDriver.entries()].map(([dId, laps]) => {
    const d = ds.driverById.get(dId);
    laps.sort((a, b) => a.lap - b.lap);
    return {
      driverId: dId,
      name: d?.fullName || `Driver #${dId}`,
      code: d?.code || (d ? d.surname.substring(0, 3).toUpperCase() : "DRV"),
      laps,
    };
  });

  // Sort drivers by final finish position
  const res = ds.resultsByRace.get(raceId) || [];
  const finishOrder = new Map(res.map((r) => [r.driverId, r.positionOrder]));
  drivers.sort((a, b) => (finishOrder.get(a.driverId) ?? 99) - (finishOrder.get(b.driverId) ?? 99));

  return {
    maxLaps,
    drivers,
  };
}

export interface PitWindow {
  stop: number;
  minLap: number;
  medianLap: number;
  maxLap: number;
  count: number;
}

export interface TyreCompoundDegradation {
  compound: string;
  totalLapsTracked: number;
  avgLapTimeMs: number;
  avgLapTimeFormatted: string;
  lapsOnCompound: { tyreAge: number; avgLapTimeMs: number; formatted: string; sampleCount: number }[];
}

export function calculatePitStrategy(raceId: number) {
  const ds = getDataset();
  const race = ds.raceById.get(raceId);
  const stops = ds.pitStops.filter((p) => p.raceId === raceId);

  // Group stops by stop number (1, 2, 3...) to determine real pit windows
  const stopsByNum = new Map<number, number[]>();
  stops.forEach((s) => {
    let arr = stopsByNum.get(s.stop);
    if (!arr) {
      arr = [];
      stopsByNum.set(s.stop, arr);
    }
    arr.push(s.lap);
  });

  const pitWindows: PitWindow[] = [];
  [...stopsByNum.entries()]
    .sort((a, b) => a[0] - b[0])
    .forEach(([stopNum, laps]) => {
      laps.sort((a, b) => a - b);
      const minLap = laps[0];
      const maxLap = laps[laps.length - 1];
      const medianLap = laps[Math.floor(laps.length / 2)];
      pitWindows.push({
        stop: stopNum,
        minLap,
        medianLap,
        maxLap,
        count: laps.length,
      });
    });

  // Tyre stints check (tyre_stints.csv)
  const tyreStintRows = readTable("tyre_stints.csv").filter((t) => Number(t.raceId) === raceId);
  const hasTyreData = tyreStintRows.length > 0;

  // Real degradation curves using lap_times + tyre_stints
  const compoundDegradation: TyreCompoundDegradation[] = [];

  if (hasTyreData) {
    const lapIdx = getLapIndex().get(raceId);
    // Map driverCode -> driverId
    const codeToDriverId = new Map<string, number>();
    ds.drivers.forEach((d) => {
      if (d.code) codeToDriverId.set(d.code.toUpperCase(), d.driverId);
    });

    // Build map of (driverId, lap) -> { compound, tyreAge }
    const lapTyreInfo = new Map<string, { compound: string; tyreAge: number }>();
    tyreStintRows.forEach((stint) => {
      const code = String(stint.driverCode || "").toUpperCase();
      const dId = codeToDriverId.get(code);
      if (!dId) return;

      const compound = String(stint.compound || "UNKNOWN").toUpperCase();
      const start = Number(stint.lapStart);
      const end = Number(stint.lapEnd);
      const baseAge = Number(stint.tyreAge) || 0;

      for (let l = start; l <= end; l++) {
        const age = baseAge + (l - start + 1);
        lapTyreInfo.set(`${dId}:${l}`, { compound, tyreAge: age });
      }
    });

    if (lapIdx) {
      // Collect lap times per compound and per tyre age
      const compoundBuckets = new Map<string, Map<number, number[]>>();

      for (let i = 0; i < lapIdx.length; i++) {
        const dId = lapIdx.driverId[i];
        const lap = lapIdx.lap[i];
        const ms = lapIdx.ms[i];

        // Exclude lap 1 and abnormal outliers (e.g. pit in/out or SC)
        if (lap <= 1 || ms <= 0) continue;

        const info = lapTyreInfo.get(`${dId}:${lap}`);
        if (!info) continue;

        let ageMap = compoundBuckets.get(info.compound);
        if (!ageMap) {
          ageMap = new Map();
          compoundBuckets.set(info.compound, ageMap);
        }

        let times = ageMap.get(info.tyreAge);
        if (!times) {
          times = [];
          ageMap.set(info.tyreAge, times);
        }
        times.push(ms);
      }

      compoundBuckets.forEach((ageMap, compound) => {
        let allTimes: number[] = [];
        const lapsOnCompound: { tyreAge: number; avgLapTimeMs: number; formatted: string; sampleCount: number }[] = [];

        [...ageMap.entries()]
          .sort((a, b) => a[0] - b[0])
          .forEach(([tyreAge, times]) => {
            // Trim 10% highest to eliminate yellow flag / traffic laps
            times.sort((a, b) => a - b);
            const trimmed = times.length > 2 ? times.slice(0, Math.ceil(times.length * 0.85)) : times;
            const avgMs = Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);
            allTimes.push(...trimmed);
            lapsOnCompound.push({
              tyreAge,
              avgLapTimeMs: avgMs,
              formatted: formatLapMs(avgMs),
              sampleCount: times.length,
            });
          });

        if (allTimes.length > 0) {
          const overallAvg = Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length);
          compoundDegradation.push({
            compound,
            totalLapsTracked: allTimes.length,
            avgLapTimeMs: overallAvg,
            avgLapTimeFormatted: formatLapMs(overallAvg),
            lapsOnCompound,
          });
        }
      });
    }
  }

  return {
    raceId,
    raceName: race?.name || "Grand Prix",
    stops,
    pitWindows,
    hasTyreData,
    stints: tyreStintRows,
    compoundDegradation,
  };
}

export interface ReplayDriverState {
  driverId: number;
  driverName: string;
  code: string;
  constructorName: string;
  teamColor: string;
  position: number;
  lapTime: string;
  cumulativeMs: number;
  gapToLeader: string;
  intervalToAhead: string;
  isPitting: boolean;
  isOut: boolean;
}

export interface ReplayFrame {
  lap: number;
  drivers: ReplayDriverState[];
}

export function calculateRaceReplay(raceId: number): {
  raceId: number;
  raceName: string;
  circuitId: number;
  circuitName: string;
  circuitRef: string;
  trackGeometry: {
    name: string;
    country: string;
    lengthKm?: number;
    turns?: number;
    drsZones?: number;
    coordinates: [number, number][];
  } | null;
  totalLaps: number;
  frames: ReplayFrame[];
} | null {
  const ds = getDataset();
  const race = ds.raceById.get(raceId);
  if (!race) return null;

  const lapIdx = getLapIndex().get(raceId);
  if (!lapIdx || lapIdx.length === 0) return null;

  const results = ds.resultsByRace.get(raceId) || [];
  const pitStops = ds.pitStops.filter((p) => p.raceId === raceId);
  const pitMap = new Set(pitStops.map((p) => `${p.driverId}:${p.lap}`));

  // Collect laps per driver
  const driverLaps = new Map<number, Map<number, { pos: number; ms: number }>>();
  let maxLap = 0;

  for (let i = 0; i < lapIdx.length; i++) {
    const dId = lapIdx.driverId[i];
    const lap = lapIdx.lap[i];
    const pos = lapIdx.position[i];
    const ms = lapIdx.ms[i];

    if (lap > maxLap) maxLap = lap;

    let m = driverLaps.get(dId);
    if (!m) {
      m = new Map();
      driverLaps.set(dId, m);
    }
    m.set(lap, { pos, ms });
  }

  // Precalculate cumulative time per driver up to each lap
  const cumulativeTime = new Map<number, Map<number, number>>();
  driverLaps.forEach((laps, dId) => {
    let cum = 0;
    const cumMap = new Map<number, number>();
    for (let l = 1; l <= maxLap; l++) {
      const entry = laps.get(l);
      if (entry) cum += entry.ms;
      cumMap.set(l, cum);
    }
    cumulativeTime.set(dId, cumMap);
  });

  const frames: ReplayFrame[] = [];

  for (let l = 1; l <= maxLap; l++) {
    const activeOnLap: {
      driverId: number;
      pos: number;
      ms: number;
      cumMs: number;
    }[] = [];

    driverLaps.forEach((laps, dId) => {
      const entry = laps.get(l);
      if (entry) {
        activeOnLap.push({
          driverId: dId,
          pos: entry.pos,
          ms: entry.ms,
          cumMs: cumulativeTime.get(dId)?.get(l) || 0,
        });
      }
    });

    // Sort by position on this lap
    activeOnLap.sort((a, b) => a.pos - b.pos);

    const leaderCum = activeOnLap[0]?.cumMs || 0;

    const driverStates: ReplayDriverState[] = activeOnLap.map((item, idx) => {
      const d = ds.driverById.get(item.driverId);
      const res = results.find((r) => r.driverId === item.driverId);
      const c = res ? ds.constructorById.get(res.constructorId) : null;

      const gapSec = idx === 0 ? "LEADER" : `+${((item.cumMs - leaderCum) / 1000).toFixed(3)}s`;
      const prevCum = idx > 0 ? activeOnLap[idx - 1].cumMs : item.cumMs;
      const intervalSec = idx === 0 ? "--" : `+${((item.cumMs - prevCum) / 1000).toFixed(3)}s`;

      return {
        driverId: item.driverId,
        driverName: d?.fullName || `Driver #${item.driverId}`,
        code: d?.code || (d ? d.surname.substring(0, 3).toUpperCase() : "DRV"),
        constructorName: c?.name || "Constructor",
        teamColor: getTeamColor(c?.constructorRef),
        position: item.pos,
        lapTime: formatLapMs(item.ms),
        cumulativeMs: item.cumMs,
        gapToLeader: gapSec,
        intervalToAhead: intervalSec,
        isPitting: pitMap.has(`${item.driverId}:${l}`),
        isOut: false,
      };
    });

    frames.push({
      lap: l,
      drivers: driverStates,
    });
  }

  const circuit = ds.circuitById.get(race.circuitId);
  const circuitRef = circuit?.circuitRef?.toLowerCase() || "";
  const trackMaps = readJsonFile<Record<string, any>>("track_maps.json") || {};
  let trackGeometry = (circuitRef && trackMaps[circuitRef]) || null;
  if (!trackGeometry && trackMaps["bahrain"]) {
    trackGeometry = {
      ...trackMaps["bahrain"],
      name: circuit?.name || race.name,
      country: circuit?.country || "",
    };
  }

  return {
    raceId,
    raceName: race.name,
    circuitId: race.circuitId,
    circuitName: circuit?.name || "Grand Prix Circuit",
    circuitRef,
    trackGeometry,
    totalLaps: maxLap,
    frames,
  };
}

export function getRacesList(options?: {
  year?: number;
  circuitId?: number;
  driverId?: number;
  constructorId?: number;
  hasLapsOnly?: boolean;
}) {
  const ds = getDataset();
  let races = ds.races;

  if (options?.year) {
    races = races.filter((r) => r.year === options.year);
  }
  if (options?.circuitId) {
    races = races.filter((r) => r.circuitId === options.circuitId);
  }

  const lapIndex = getLapIndex();

  return races.map((r) => {
    const circuit = ds.circuitById.get(r.circuitId);
    const results = ds.resultsByRace.get(r.raceId) || [];
    const winnerResult = results.find((res) => res.position === 1);
    const winnerDriver = winnerResult ? ds.driverById.get(winnerResult.driverId) : null;
    const winnerConstructor = winnerResult ? ds.constructorById.get(winnerResult.constructorId) : null;
    const hasLaps = Boolean(lapIndex.get(r.raceId));

    return {
      raceId: r.raceId,
      year: r.year,
      round: r.round,
      name: r.name,
      date: r.date,
      time: r.time,
      circuitId: r.circuitId,
      circuitName: circuit?.name || "Circuit",
      circuitRef: circuit?.circuitRef || "",
      location: circuit?.location || "",
      country: circuit?.country || "",
      flag: flagForNationality(circuit?.country || ""),
      hasSprint: r.hasSprint,
      hasLaps,
      winner: winnerDriver
        ? {
            driverId: winnerDriver.driverId,
            name: winnerDriver.fullName,
            code: winnerDriver.code,
            constructorName: winnerConstructor?.name || "",
            teamColor: getTeamColor(winnerConstructor?.constructorRef),
          }
        : null,
    };
  }).filter((r) => !options?.hasLapsOnly || r.hasLaps);
}

