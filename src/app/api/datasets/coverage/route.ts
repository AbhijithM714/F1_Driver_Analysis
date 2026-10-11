import { NextResponse } from "next/server";
import { getOptionalDataCoverage } from "@/services/datasetCatalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const coverage = getOptionalDataCoverage();
    return NextResponse.json({
      success: true,
      data: coverage,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch coverage info" },
      { status: 500 }
    );
  }
}

