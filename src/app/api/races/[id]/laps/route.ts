import { NextResponse } from "next/server";
import { getRaceLapTimes } from "@/lib/f1DataService";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const raceId = Number(params.id);
    const lapData = getRaceLapTimes(raceId);
    return NextResponse.json({
      success: true,
      data: lapData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch lap times" },
      { status: 500 }
    );
  }
}

