import { NextResponse } from "next/server";
import { getRaceEvents } from "@/lib/f1DataService";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const raceId = Number(params.id);
    const events = getRaceEvents(raceId);
    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch race events" },
      { status: 500 }
    );
  }
}

