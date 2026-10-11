import { NextResponse } from "next/server";
import { getQualifyingResults } from "@/lib/f1DataService";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const raceId = Number(params.id);
    const results = getQualifyingResults(raceId);
    return NextResponse.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch qualifying results" },
      { status: 500 }
    );
  }
}

