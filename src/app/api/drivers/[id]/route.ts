import { NextResponse } from "next/server";
import { getValidatedDrivers } from "@/lib/driversService";
import { getDriverCareerStats } from "@/lib/f1DataService";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const drivers = getValidatedDrivers();
    const idParam = params.id.toLowerCase().trim();

    const driver = drivers.find(
      (d) =>
        d.driverRef.toLowerCase() === idParam ||
        String(d.driverId) === idParam ||
        d.code.toLowerCase() === idParam
    );

    if (!driver) {
      return NextResponse.json(
        { success: false, error: `Driver '${params.id}' not found` },
        { status: 404 }
      );
    }

    const careerStats = getDriverCareerStats(driver.driverId);

    return NextResponse.json({
      success: true,
      data: {
        ...driver,
        stats: careerStats,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch driver" },
      { status: 500 }
    );
  }
}

