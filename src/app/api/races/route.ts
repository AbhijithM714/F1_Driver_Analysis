import { NextRequest, NextResponse } from "next/server";
import { getRacesList } from "@/services/raceAnalytics";
import { getDataset } from "@/services/dataStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ds = getDataset();
    const yearParam = searchParams.get("year");
    const year = yearParam ? Number(yearParam) : undefined;
    const circuitId = searchParams.get("circuitId") ? Number(searchParams.get("circuitId")) : undefined;
    const hasLapsOnly = searchParams.get("hasLapsOnly") === "true";

    // If no filter given and year not specified, default to latest year
    const targetYear = year !== undefined ? year : circuitId ? undefined : ds.latestYear;

    const races = getRacesList({
      year: targetYear,
      circuitId,
      hasLapsOnly,
    });

    return NextResponse.json({
      success: true,
      count: races.length,
      data: races,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch races" },
      { status: 500 }
    );
  }
}
