import { NextRequest, NextResponse } from "next/server";
import { getValidatedDrivers } from "@/lib/driversService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonParam = searchParams.get("season");
    const season = seasonParam && seasonParam !== "ALL" ? Number(seasonParam) : null;
    const gridOnly = searchParams.get("grid") === "2024" || searchParams.get("active") === "true";
    const modernOnly = searchParams.get("modern") === "true";
    const championsOnly = searchParams.get("champions") === "true";
    const team = searchParams.get("team")?.toLowerCase().trim();
    const nationality = searchParams.get("nationality")?.toLowerCase().trim();
    const era = searchParams.get("era")?.toLowerCase().trim();
    const query = (searchParams.get("q") || "").toLowerCase().trim();

    let drivers = getValidatedDrivers();

    if (season && !isNaN(season)) {
      drivers = drivers.filter((d) => d.seasons && d.seasons.includes(season));
    } else if (gridOnly) {
      drivers = drivers.filter((d) => d.isCurrentGrid);
    } else if (modernOnly) {
      drivers = drivers.filter((d) => d.isModern);
    }

    if (championsOnly) {
      drivers = drivers.filter((d) => (d.titles ?? 0) > 0);
    }

    if (team) {
      drivers = drivers.filter(
        (d) =>
          d.constructorId.toLowerCase() === team ||
          d.constructorName.toLowerCase().includes(team)
      );
    }

    if (nationality) {
      drivers = drivers.filter((d) => d.nationality.toLowerCase() === nationality);
    }

    if (era) {
      if (era === "2020s") {
        drivers = drivers.filter((d) => (d.lastYear ?? 0) >= 2020);
      } else if (era === "2010s") {
        drivers = drivers.filter(
          (d) => (d.lastYear ?? 0) >= 2010 && (d.firstYear ?? 0) < 2020
        );
      } else if (era === "2000s") {
        drivers = drivers.filter(
          (d) => (d.lastYear ?? 0) >= 2000 && (d.firstYear ?? 0) < 2010
        );
      } else if (era === "historic" || era === "classic") {
        drivers = drivers.filter((d) => (d.lastYear ?? 0) < 2000);
      }
    }

    if (query) {
      drivers = drivers.filter(
        (d) =>
          d.fullName.toLowerCase().includes(query) ||
          d.code.toLowerCase().includes(query) ||
          d.nationality.toLowerCase().includes(query) ||
          String(d.number).includes(query) ||
          d.driverRef.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      success: true,
      count: drivers.length,
      data: drivers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch drivers" },
      { status: 500 }
    );
  }
}
