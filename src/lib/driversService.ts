/**
 * Driver Service Layer
 * --------------------
 * High-performance, 100% dynamic driver data access.
 * Replaces hardcoded grid maps with dataset-derived active roster and team assignments.
 */
import { getDriverSummaries } from "@/services/driverAnalytics";
import { getDataset } from "@/services/dataStore";
import { flagForNationality, NATIONALITY_FLAGS } from "./flags";
import { getTeamColor } from "./f1Themes";
import type { DriverRecord } from "./apiTypes";

export { NATIONALITY_FLAGS };
export type { DriverRecord };

// Backward-compatibility export: dynamically populated from latest active grid
export const CURRENT_2024_GRID: Record<string, { constructorId: string; number: number }> = {};

function calculateAge(dobString: string | null): number | null {
  if (!dobString || dobString.includes("\\N")) return null;
  const birth = new Date(dobString);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function getValidatedDrivers(): DriverRecord[] {
  const ds = getDataset();
  const summaries = getDriverSummaries();

  return summaries.map(({ driver, stats, titles, latestConstructorId, latestNumber, isActive, seasons }) => {
    const c = latestConstructorId ? ds.constructorById.get(latestConstructorId) : null;
    const constructorRef = c ? c.constructorRef : "historic";
    const constructorName = c ? c.name : isActive ? "Formula 1 Team" : "Historic Driver";
    const teamColor = getTeamColor(constructorRef);

    // Populate backward-compatible grid object for active drivers
    if (isActive) {
      CURRENT_2024_GRID[driver.driverRef] = {
        constructorId: constructorRef,
        number: latestNumber ?? (driver.number || 0),
      };
    }

    const code = driver.code || driver.surname.substring(0, 3).toUpperCase() || "DRV";
    const age = calculateAge(driver.dob);
    const isModern = isActive || (stats.lastYear !== null && stats.lastYear >= 2010);

    return {
      driverId: driver.driverId,
      driverRef: driver.driverRef,
      number: latestNumber ?? driver.number,
      code,
      givenName: driver.forename,
      familyName: driver.surname,
      fullName: driver.fullName,
      dob: driver.dob || "Unknown",
      age,
      nationality: driver.nationality,
      flag: flagForNationality(driver.nationality),
      constructorId: constructorRef,
      constructorName,
      teamColor,
      url: driver.url,
      isCurrentGrid: isActive,
      isModern,
      starts: stats.starts,
      wins: stats.wins,
      podiums: stats.podiums,
      poles: stats.poles,
      titles,
      firstYear: stats.firstYear,
      lastYear: stats.lastYear,
      seasons,
    };
  });
}
