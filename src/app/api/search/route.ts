import { NextRequest, NextResponse } from "next/server";
import { executeSearch, SearchCategory } from "@/services/searchService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = (searchParams.get("type") || "all") as SearchCategory | "all";
    const limit = Number(searchParams.get("limit")) || 20;

    const results = executeSearch(query, category, limit);

    return NextResponse.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Search failed" },
      { status: 500 }
    );
  }
}

