import { NextRequest, NextResponse } from "next/server";
import { compareDrivers, resolveDriver } from "@/services/driverAnalytics";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const aParam = searchParams.get("a");
    const bParam = searchParams.get("b");

    if (!aParam || !bParam) {
      return NextResponse.json(
        { success: false, error: "Both 'a' and 'b' driver parameters are required" },
        { status: 400 }
      );
    }

    const driverA = resolveDriver(aParam);
    const driverB = resolveDriver(bParam);

    if (!driverA) {
      return NextResponse.json(
        { success: false, error: `Driver '${aParam}' not found` },
        { status: 404 }
      );
    }
    if (!driverB) {
      return NextResponse.json(
        { success: false, error: `Driver '${bParam}' not found` },
        { status: 404 }
      );
    }

    const comparison = compareDrivers(driverA.driverId, driverB.driverId);

    return NextResponse.json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to compare drivers" },
      { status: 500 }
    );
  }
}

