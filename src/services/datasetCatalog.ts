/**
 * Dataset catalog & status service
 * --------------------------------
 * Tracks availability, exact row counts, file size, last modified,
 * and per-race coverage for optional FastF1-style telemetry/stints datasets.
 */
import fs from "fs";
import path from "path";
import { DATA_DIR, memo, readTable } from "./dataStore";

export interface DatasetFileInfo {
  fileName: string;
  category: "core" | "optional" | "geometry";
  exists: boolean;
  rowCount: number;
  sizeBytes: number;
  lastModified: string | null;
  description: string;
  requiredColumns: string[];
  sourceUrl: string;
}

export interface CoverageInfo {
  raceId: number;
  raceName: string;
  year: number;
  hasLaps: boolean;
  hasPitStops: boolean;
  hasTyreStints: boolean;
  hasTelemetry: boolean;
  hasSectorTimes: boolean;
  hasWeather: boolean;
  hasSafetyCars: boolean;
  hasPenalties: boolean;
  hasDrs: boolean;
}

const DATASET_SPECS: {
  fileName: string;
  category: "core" | "optional" | "geometry";
  description: string;
  requiredColumns: string[];
  sourceUrl: string;
}[] = [
  {
    fileName: "drivers.csv",
    category: "core",
    description: "Driver biographical details, codes, permanent numbers, and nationality",
    requiredColumns: ["driverId", "driverRef", "number", "code", "forename", "surname", "dob", "nationality", "url"],
    sourceUrl: "https://ergast.com/mrd/db/ or Jolpica F1",
  },
  {
    fileName: "constructors.csv",
    category: "core",
    description: "F1 constructor identifiers, team names, nationality, and references",
    requiredColumns: ["constructorId", "constructorRef", "name", "nationality", "url"],
    sourceUrl: "https://ergast.com/mrd/db/",
  },
  {
    fileName: "circuits.csv",
    category: "core",
    description: "Circuit names, geo-coordinates, location city, and country",
    requiredColumns: ["circuitId", "circuitRef", "name", "location", "country", "lat", "lng", "alt", "url"],
    sourceUrl: "https://ergast.com/mrd/db/",
  },
  {
    fileName: "races.csv",
    category: "core",
    description: "Calendar of all World Championship Grands Prix 1950-2024",
    requiredColumns: ["raceId", "year", "round", "circuitId", "name", "date", "time", "url"],
    sourceUrl: "https://ergast.com/mrd/db/",
  },
  {
    fileName: "results.csv",
    category: "core",
    description: "Official Grand Prix finishing classifications, points, and laps",
    requiredColumns: ["resultId", "raceId", "driverId", "constructorId", "grid", "position", "points", "laps", "statusId"],
    sourceUrl: "https://ergast.com/mrd/db/",
  },
  {
    fileName: "qualifying.csv",
    category: "core",
    description: "Qualifying session classifications, Q1/Q2/Q3 lap times and grid slots",
    requiredColumns: ["qualifyId", "raceId", "driverId", "constructorId", "number", "position", "q1", "q2", "q3"],
    sourceUrl: "https://ergast.com/mrd/db/",
  },
  {
    fileName: "driver_standings.csv",
    category: "core",
    description: "Official World Championship points standings per race for drivers",
    requiredColumns: ["driverStandingsId", "raceId", "driverId", "points", "position", "positionText", "wins"],
    sourceUrl: "https://ergast.com/mrd/db/",
  },
  {
    fileName: "constructor_standings.csv",
    category: "core",
    description: "Official Constructors' Championship standings per race",
    requiredColumns: ["constructorStandingsId", "raceId", "constructorId", "points", "position", "positionText", "wins"],
    sourceUrl: "https://ergast.com/mrd/db/",
  },
  {
    fileName: "pit_stops.csv",
    category: "core",
    description: "In-race pit stop event log with stop number, lap, and duration in seconds",
    requiredColumns: ["raceId", "driverId", "stop", "lap", "time", "duration", "milliseconds"],
    sourceUrl: "https://ergast.com/mrd/db/",
  },
  {
    fileName: "lap_times.csv",
    category: "core",
    description: "Lap-by-lap timing records and running positions (1996-2024)",
    requiredColumns: ["raceId", "driverId", "lap", "position", "time", "milliseconds"],
    sourceUrl: "https://ergast.com/mrd/db/",
  },
  {
    fileName: "status.csv",
    category: "core",
    description: "Status codes mapping finish conditions and retirement causes",
    requiredColumns: ["statusId", "status"],
    sourceUrl: "https://ergast.com/mrd/db/",
  },
  {
    fileName: "sprint_results.csv",
    category: "core",
    description: "Sprint race classifications and points (2021-present)",
    requiredColumns: ["sprintResultId", "raceId", "driverId", "constructorId", "grid", "position", "points", "laps"],
    sourceUrl: "https://ergast.com/mrd/db/",
  },
  {
    fileName: "tyre_stints.csv",
    category: "optional",
    description: "Pirelli compound allocations, stint start/end laps, and tyre ages",
    requiredColumns: ["raceId", "driverCode", "stint", "compound", "lapStart", "lapEnd", "lapCount", "tyreAge"],
    sourceUrl: "FastF1 Python library (`session.laps[['Driver', 'Stint', 'Compound', ...]]`)",
  },
  {
    fileName: "telemetry.csv",
    category: "optional",
    description: "High-frequency car sensor telemetry: speed, throttle, brake, gear, RPM, DRS, and X/Y coordinates",
    requiredColumns: ["raceId", "driverCode", "lapNumber", "distance", "speed", "throttle", "brake", "gear", "rpm", "drs", "x", "y"],
    sourceUrl: "FastF1 Python library (`lap.get_telemetry()`)",
  },
  {
    fileName: "sector_times.csv",
    category: "optional",
    description: "Micro-sector split times and intermediate speed trap readings",
    requiredColumns: ["raceId", "driverCode", "lapNumber", "sector1Time", "sector2Time", "sector3Time", "speedI1", "speedI2", "speedST", "speedFL"],
    sourceUrl: "FastF1 Python library (`laps[['Sector1Time', 'Sector2Time', 'Sector3Time']]`)",
  },
  {
    fileName: "weather.csv",
    category: "optional",
    description: "Track and atmospheric weather samples: air/track temp, humidity, pressure, wind, rain",
    requiredColumns: ["raceId", "timeMinutes", "airTemp", "trackTemp", "humidity", "pressure", "windSpeed", "windDirection", "rainfall"],
    sourceUrl: "FastF1 Python library (`session.weather_data`)",
  },
  {
    fileName: "drs_usage.csv",
    category: "optional",
    description: "DRS activation statistics, distance under DRS, and top speeds",
    requiredColumns: ["raceId", "driverCode", "totalLaps", "drsZonesAvailable", "drsLapsActivated", "drsDistanceKm", "drsTopSpeedKmh"],
    sourceUrl: "FastF1 telemetry DRS channel aggregation",
  },
  {
    fileName: "safety_car_events.csv",
    category: "optional",
    description: "Safety car, Virtual Safety Car, and red flag period timestamps and lap numbers",
    requiredColumns: ["eventId", "raceId", "lap", "type", "category", "message", "flag", "time"],
    sourceUrl: "FIA Race Director event notes / FastF1 track status",
  },
  {
    fileName: "penalties.csv",
    category: "optional",
    description: "Stewards decisions, time penalties, reprimands, and disqualifications",
    requiredColumns: ["penaltyId", "raceId", "lap", "driverNumber", "type", "message", "time"],
    sourceUrl: "FIA Stewards documents",
  },
  {
    fileName: "fastest_laps.csv",
    category: "optional",
    description: "Race fastest lap rankings with average speed",
    requiredColumns: ["raceId", "driverId", "driverCode", "lapNumber", "rank", "lapTime", "avgSpeedKmh"],
    sourceUrl: "Ergast / FastF1 session results",
  },
  {
    fileName: "track_maps.json",
    category: "geometry",
    description: "Circuit SVG geometry coordinates, turn counts, and official DRS zones",
    requiredColumns: ["lengthKm", "turns", "drsZones", "coordinates"],
    sourceUrl: "OpenStreetMap / FastF1 circuit coordinates",
  },
  {
    fileName: "driver_images.json",
    category: "geometry",
    description: "Driver portrait and transparent suit headshot image mapping",
    requiredColumns: ["driverId", "imageUrl"],
    sourceUrl: "Formula1.com Official Driver Profiles",
  },
  {
    fileName: "team_logos.json",
    category: "geometry",
    description: "Constructor official vector emblem and badge mapping",
    requiredColumns: ["constructorId", "logoUrl"],
    sourceUrl: "Formula1.com Official Teams",
  },
];

export function getDatasetCatalog(): {
  datasets: DatasetFileInfo[];
  summary: {
    totalFiles: number;
    presentFiles: number;
    missingFiles: number;
    coreReady: boolean;
    totalRows: number;
  };
} {
  const fileNames = DATASET_SPECS.map((s) => s.fileName);
  return memo("datasetCatalog_v2", fileNames, () => {
    let presentCount = 0;
    let totalRows = 0;
    let coreReady = true;

    const datasets: DatasetFileInfo[] = DATASET_SPECS.map((spec) => {
      const full = path.join(DATA_DIR, spec.fileName);
      const exists = fs.existsSync(full);
      let rowCount = 0;
      let sizeBytes = 0;
      let lastModified: string | null = null;

      if (exists) {
        presentCount++;
        try {
          const stat = fs.statSync(full);
          sizeBytes = stat.size;
          lastModified = stat.mtime.toISOString();

          if (spec.fileName.endsWith(".json")) {
            const raw = JSON.parse(fs.readFileSync(full, "utf-8"));
            rowCount = Object.keys(raw).length;
          } else {
            // Count lines for accurate row count
            const content = fs.readFileSync(full, "utf-8");
            let lines = 0;
            for (let i = 0; i < content.length; i++) {
              if (content.charCodeAt(i) === 10) lines++;
            }
            if (content.length > 0 && content.charCodeAt(content.length - 1) !== 10) lines++;
            rowCount = Math.max(0, lines - 1); // exclude header
          }
          totalRows += rowCount;
        } catch (e) {
          console.error(`Error reading ${spec.fileName}`, e);
        }
      } else {
        if (spec.category === "core") coreReady = false;
      }

      return {
        fileName: spec.fileName,
        category: spec.category,
        exists,
        rowCount,
        sizeBytes,
        lastModified,
        description: spec.description,
        requiredColumns: spec.requiredColumns,
        sourceUrl: spec.sourceUrl,
      };
    });

    return {
      datasets,
      summary: {
        totalFiles: DATASET_SPECS.length,
        presentFiles: presentCount,
        missingFiles: DATASET_SPECS.length - presentCount,
        coreReady,
        totalRows,
      },
    };
  });
}

export function getOptionalDataCoverage(): {
  racesWithTelemetry: number[];
  racesWithStints: number[];
  racesWithWeather: number[];
  racesWithEvents: number[];
  racesWithSectors: number[];
  racesWithDrs: number[];
} {
  return memo(
    "optionalDataCoverage",
    ["telemetry.csv", "tyre_stints.csv", "weather.csv", "safety_car_events.csv", "sector_times.csv", "drs_usage.csv"],
    () => {
      const getRaceIds = (file: string) => {
        const rows = readTable(file);
        return Array.from(new Set(rows.map((r) => Number(r.raceId)).filter((id) => !isNaN(id) && id > 0)));
      };

      return {
        racesWithTelemetry: getRaceIds("telemetry.csv"),
        racesWithStints: getRaceIds("tyre_stints.csv"),
        racesWithWeather: getRaceIds("weather.csv"),
        racesWithEvents: getRaceIds("safety_car_events.csv"),
        racesWithSectors: getRaceIds("sector_times.csv"),
        racesWithDrs: getRaceIds("drs_usage.csv"),
      };
    }
  );
}

