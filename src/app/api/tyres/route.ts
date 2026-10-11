import { NextRequest, NextResponse } from "next/server";
import { calculatePitStrategy } from "@/services/raceAnalytics";
import { dataFileExists } from "@/services/dataStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raceId = Number(searchParams.get("raceId")) || 1121;
    const driverParam = searchParams.get("driver")?.toUpperCase();

    const exists = dataFileExists("tyre_stints.csv");
    const strategy = calculatePitStrategy(raceId);

    let stints = strategy.stints;
    if (driverParam) {
      stints = stints.filter((s: any) => String(s.driverCode || "").toUpperCase() === driverParam);
    }

    const driversInStints = Array.from(
      new Set(strategy.stints.map((s: any) => String(s.driverCode || "").toUpperCase()).filter(Boolean))
    );

    return NextResponse.json({
      success: true,
      data: {
        raceId,
        raceName: strategy.raceName,
        hasTyreData: exists && strategy.hasTyreData,
        stints,
        drivers: driversInStints,
        pitWindows: strategy.pitWindows,
        compoundDegradation: strategy.compoundDegradation,
        stops: strategy.stops,
        missingInfo: !strategy.hasTyreData
          ? {
              reason: "Tyre stints dataset (tyre_stints.csv) has not been imported for this Grand Prix.",
              requiredColumns: ["raceId", "driverCode", "stint", "compound", "lapStart", "lapEnd", "lapCount", "tyreAge"],
              sourceGuide: "Available via FastF1 Python library (`session.laps[['Driver', 'Stint', 'Compound', ...]]`)",
            }
          : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch tyre stints" },
      { status: 500 }
    );
  }
}
