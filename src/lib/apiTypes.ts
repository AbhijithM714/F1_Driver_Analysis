/**
 * Shared API & Model Types
 * Used across frontend pages and backend services.
 */

export interface DriverRecord {
  driverId: number;
  driverRef: string;
  number: number | null;
  code: string;
  givenName: string;
  familyName: string;
  fullName: string;
  dob: string;
  age: number | null;
  nationality: string;
  flag: string;
  constructorId: string;
  constructorName: string;
  teamColor: string;
  url: string;
  isCurrentGrid: boolean;
  isModern: boolean;
  starts?: number;
  wins?: number;
  podiums?: number;
  poles?: number;
  titles?: number;
  firstYear?: number | null;
  lastYear?: number | null;
  seasons?: number[];
  imageUrl?: string | null;
}

export interface ConstructorRecord {
  constructorId: number;
  constructorRef: string;
  name: string;
  nationality: string;
  flag: string;
  url: string;
  color: string;
  accentColor: string;
  totalWins: number;
  totalPodiums: number;
  totalPoints: number;
  totalStarts: number;
  totalDnfs: number;
  reliabilityScore: number;
  isCurrentGrid: boolean;
  championships?: number;
  titleYears?: number[];
  raceEntries?: number;
  totalPoles?: number;
  firstYear?: number | null;
  lastYear?: number | null;
}

export interface CircuitRecord {
  circuitId: number;
  circuitRef: string;
  name: string;
  location: string;
  country: string;
  flag: string;
  lat: number;
  lng: number;
  alt: number;
  url: string;
  totalRaces?: number;
  firstGrandPrixYear?: number | null;
  latestGrandPrixYear?: number | null;
  lengthKm?: number | null;
  turns?: number | null;
  drsZones?: number | null;
  lapRecord?: any;
}

