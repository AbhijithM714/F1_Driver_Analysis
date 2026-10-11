import { NextResponse } from "next/server";
import { getRaceWeather } from "@/lib/f1DataService";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const raceId = Number(params.id);
    const weather = getRaceWeather(raceId);
    return NextResponse.json({
      success: true,
      data: weather,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch weather" },
      { status: 500 }
    );
  }
}

