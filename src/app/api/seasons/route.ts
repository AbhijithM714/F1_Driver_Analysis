import { NextResponse } from "next/server";
import { getAvailableSeasons } from "@/services/championshipAnalytics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const seasons = getAvailableSeasons();
    return NextResponse.json({
      success: true,
      data: seasons,
      years: seasons.map((s) => s.year),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch seasons" },
      { status: 500 }
    );
  }
}

