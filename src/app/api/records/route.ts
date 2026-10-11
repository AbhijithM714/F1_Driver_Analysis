import { NextResponse } from "next/server";
import { calculateHistoricalRecords } from "@/services/recordAnalytics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const records = calculateHistoricalRecords();
    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch historical records" },
      { status: 500 }
    );
  }
}
