import { NextResponse } from "next/server";
import { getRaceDrs } from "@/lib/f1DataService";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const raceId = Number(params.id);
    const drs = getRaceDrs(raceId);
    return NextResponse.json({
      success: true,
      data: drs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch DRS data" },
      { status: 500 }
    );
  }
}

