import { NextResponse } from "next/server";
import { getTrackMaps } from "@/lib/f1DataService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const maps = getTrackMaps();
    return NextResponse.json({
      success: true,
      data: maps,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch track maps" },
      { status: 500 }
    );
  }
}
