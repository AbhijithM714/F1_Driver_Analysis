import { NextRequest, NextResponse } from "next/server";
import { getAllCircuitSummaries } from "@/services/circuitAnalytics";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const query = searchParams.get("q")?.toLowerCase().trim();

    let circuits = getAllCircuitSummaries();

    if (country) {
      circuits = circuits.filter((c) => c.country.toLowerCase() === country.toLowerCase());
    }

    if (query) {
      circuits = circuits.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.location.toLowerCase().includes(query) ||
          c.country.toLowerCase().includes(query) ||
          c.circuitRef.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      success: true,
      count: circuits.length,
      data: circuits,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch circuits" },
      { status: 500 }
    );
  }
}

