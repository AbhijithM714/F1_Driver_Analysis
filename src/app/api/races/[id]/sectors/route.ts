import { NextResponse } from "next/server";
import { getRaceSectors } from "@/lib/f1DataService";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const raceId = Number(params.id);
    const sectors = getRaceSectors(raceId);
    return NextResponse.json({
      success: true,
      data: sectors,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch sector times" },
      { status: 500 }
    );
  }
}

