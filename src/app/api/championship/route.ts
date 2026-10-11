import { NextRequest, NextResponse } from "next/server";
import { getChampionshipStandings, getChampionshipProgression } from "@/lib/f1DataService";
import { getDataset } from "@/services/dataStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ds = getDataset();
    const yearParam = searchParams.get("year");
    const year = yearParam ? Number(yearParam) : ds.latestYear;

    const standings = getChampionshipStandings(year);
    const progression = getChampionshipProgression(year);

    return NextResponse.json({
      success: true,
      data: {
        ...standings,
        progression,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch championship standings" },
      { status: 500 }
    );
  }
}
