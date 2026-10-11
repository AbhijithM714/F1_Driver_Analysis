import { NextRequest, NextResponse } from "next/server";
import { dataFileExists, readJsonFile, readTable } from "@/services/dataStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hasTelemetryFile = dataFileExists("telemetry.csv");

    if (!hasTelemetryFile) {
      return NextResponse.json({
        success: false,
        isAvailable: false,
        error: "Telemetry dataset not imported",
        requiredColumns: [
          "raceId",
          "driverCode",
          "lapNumber",
          "distance",
          "speed",
          "throttle",
          "brake",
          "gear",
          "rpm",
          "drs",
          "x",
          "y",
        ],
        sourceGuide:
          "Telemetry data can be exported using the Python FastF1 library: `session = fastf1.get_session(year, round, 'R'); session.load(); lap = session.laps.pick_fastest(); tel = lap.get_telemetry()`",
        data: null,
      });
    }

    const rows = readTable("telemetry.csv");
    if (rows.length === 0) {
      return NextResponse.json({
        success: false,
        isAvailable: false,
        error: "Telemetry file is empty",
        data: null,
      });
    }

    // Available races in the telemetry file
    const racesWithTelemetry = Array.from(
      new Set(rows.map((r) => Number(r.raceId)).filter((id) => !isNaN(id) && id > 0))
    );

    const raceIdParam = searchParams.get("raceId");
    const raceId = raceIdParam ? Number(raceIdParam) : racesWithTelemetry[0] || 1121;

    // Filter by raceId
    const raceRows = rows.filter((r) => Number(r.raceId) === raceId || !r.raceId);
    const availableDrivers = Array.from(
      new Set(raceRows.map((r) => String(r.driverCode || "").toUpperCase()).filter(Boolean))
    );

    const d1Param = (searchParams.get("driver1") || searchParams.get("driverA") || availableDrivers[0] || "").toUpperCase();
    const d2Param = (searchParams.get("driver2") || searchParams.get("driverB") || availableDrivers[1] || "").toUpperCase();

    const driver1Data = raceRows
      .filter((r) => String(r.driverCode || "").toUpperCase() === d1Param)
      .sort((a, b) => (Number(a.distance) || 0) - (Number(b.distance) || 0));

    const driver2Data = raceRows
      .filter((r) => String(r.driverCode || "").toUpperCase() === d2Param)
      .sort((a, b) => (Number(a.distance) || 0) - (Number(b.distance) || 0));

    // Load track coordinates if available
    const trackMaps = readJsonFile<Record<string, any>>("track_maps.json") || {};
    const trackMap = trackMaps["bahrain"] || Object.values(trackMaps)[0] || null;

    const obj1 = {
      code: d1Param,
      driverCode: d1Param,
      points: driver1Data,
      samples: driver1Data,
      sampleCount: driver1Data.length,
      hasData: driver1Data.length > 0,
    };

    const obj2 = {
      code: d2Param,
      driverCode: d2Param,
      points: driver2Data,
      samples: driver2Data,
      sampleCount: driver2Data.length,
      hasData: driver2Data.length > 0,
    };

    return NextResponse.json({
      success: true,
      isAvailable: true,
      data: {
        raceId,
        availableRaces: racesWithTelemetry,
        availableDrivers,
        driver1: obj1,
        driver2: obj2,
        driverA: obj1,
        driverB: obj2,
        trackMap,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch telemetry" },
      { status: 500 }
    );
  }
}
