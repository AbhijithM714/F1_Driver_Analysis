import { NextRequest, NextResponse } from "next/server";
import { calculatePitStrategy } from "@/services/raceAnalytics";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const raceId = Number(params.id);
    if (isNaN(raceId)) {
      return NextResponse.json({ success: false, error: "Invalid race ID" }, { status: 400 });
    }

    const strategy = calculatePitStrategy(raceId);

    return NextResponse.json({
      success: true,
      data: strategy,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate pit strategy" },
      { status: 500 }
    );
  }
}

