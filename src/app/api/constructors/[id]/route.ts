import { NextRequest, NextResponse } from "next/server";
import { calculateConstructorStats, resolveConstructor } from "@/services/constructorAnalytics";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const idParam = params.id;
    const constructor = resolveConstructor(idParam);

    if (!constructor) {
      return NextResponse.json(
        { success: false, error: `Constructor '${idParam}' not found` },
        { status: 404 }
      );
    }

    const stats = calculateConstructorStats(constructor.constructorId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch constructor details" },
      { status: 500 }
    );
  }
}

