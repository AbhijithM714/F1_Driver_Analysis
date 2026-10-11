import { NextResponse } from "next/server";
import { getRaceOverview } from "@/lib/f1DataService";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const raceId = Number(params.id);
    const overview = getRaceOverview(raceId);
    if (!overview) {
      return NextResponse.json(
        { success: false, error: "Race not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      data: overview,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch race overview" },
      { status: 500 }
    );
  }
}

