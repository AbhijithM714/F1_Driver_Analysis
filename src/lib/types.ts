export type TeamId =
  | "ferrari"
  | "red_bull"
  | "mercedes"
  | "mclaren"
  | "aston_martin"
  | "alpine"
  | "williams"
  | "haas"
  | "sauber"
  | "rb";

export interface Driver {
  driverId: string;
  permanentNumber?: string | number;
  code: string;
  givenName: string;
  familyName: string;
  fullName?: string;
  dateOfBirth?: string;
  nationality: string;
  constructorId: TeamId | string;
  constructorName?: string;
  championshipPosition?: number;
  points?: number;
  wins?: number;
  podiums?: number;
  poles?: number;
  fastestLaps?: number;
  averageQualifying?: number;
  averageFinish?: number;
  bio?: string;
  headshotUrl?: string;
}

export interface Constructor {
  constructorId: string;
  name: string;
  nationality: string;
  color?: string;
  drivers?: string[];
  points?: number;
  position?: number;
  wins?: number;
  podiums?: number;
  reliabilityScore?: number;
  averagePitStopTime?: number;
  logoUrl?: string;
}

export interface Circuit {
  circuitId: string;
  circuitName: string;
  location: string;
  country: string;
  lat?: number;
  lng?: number;
  lengthKm?: number;
  lapRecord?: string;
  lapRecordHolder?: string;
  lapRecordYear?: number;
  corners?: number;
  drsZones?: number;
  mapSvgUrl?: string;
}

export interface RaceResult {
  raceId: string;
  year: number;
  round: number;
  raceName: string;
  circuitId: string;
  date: string;
  driverId: string;
  constructorId: string;
  grid: number;
  position: number;
  positionText: string;
  points: number;
  laps: number;
  timeMillis?: number;
  timeString?: string;
  fastestLap?: number;
  fastestLapTime?: string;
  status: string; // Finished, +1 Lap, DNF, Collision, etc.
}

export interface QualifyingResult {
  raceId: string;
  driverId: string;
  constructorId: string;
  position: number;
  q1?: string;
  q2?: string;
  q3?: string;
  deltaToPole?: number;
}

export interface SprintResult {
  raceId: string;
  driverId: string;
  constructorId: string;
  grid: number;
  position: number;
  points: number;
  timeString?: string;
}

export interface LapTime {
  raceId: string;
  driverId: string;
  lapNumber: number;
  position: number;
  lapTimeSeconds: number;
  lapTimeString: string;
  sector1?: number;
  sector2?: number;
  sector3?: number;
  compound?: "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET";
  tyreAge?: number;
  pitIn?: boolean;
  pitOut?: boolean;
}

export interface PitStop {
  raceId: string;
  driverId: string;
  constructorId?: string;
  stopNumber: number;
  lap: number;
  durationSeconds: number;
  stationarySeconds?: number;
  compoundFrom?: string;
  compoundTo?: string;
}

export interface TyreStint {
  raceId: string;
  driverId: string;
  stintNumber: number;
  compound: "SOFT" | "MEDIUM" | "HARD" | "INTERMEDIATE" | "WET";
  startLap: number;
  endLap: number;
  lapsTotal: number;
  avgPace?: number;
  degPerLap?: number;
}

export interface TelemetryPoint {
  distance: number; // in meters
  time: number; // in seconds
  speed: number; // km/h
  throttle: number; // 0-100%
  brake: number; // 0 or 0-100%
  gear: number; // 1-8
  rpm: number; // 0-15000
  drs: number; // 0, 8, 10, 12 or 0/1
  nGear?: number;
  x?: number;
  y?: number;
  z?: number;
}

export interface WeatherData {
  raceId: string;
  time: string;
  airTemp: number;
  trackTemp: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  rainfall: boolean | number;
}

export interface SafetyCarEvent {
  raceId: string;
  type: "VSC" | "SC" | "RED_FLAG";
  deployedLap: number;
  withdrawnLap: number;
  reason?: string;
}

export interface PenaltyEvent {
  raceId: string;
  driverId: string;
  lap: number;
  penaltyType: string;
  penaltyDurationSeconds?: number;
  penaltyPoints?: number;
  reason: string;
}

