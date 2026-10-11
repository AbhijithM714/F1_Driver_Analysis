import { NextRequest, NextResponse } from "next/server";
import { compareConstructors, resolveConstructor } from "@/services/constructorAnalytics";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const aParam = searchParams.get("a");
    const bParam = searchParams.get("b");

    if (!aParam || !bParam) {
      return NextResponse.json(
        { success: false, error: "Both 'a' and 'b' constructor parameters are required" },
        { status: 400 }
      );
    }

    const constructorA = resolveConstructor(aParam);
    const constructorB = resolveConstructor(bParam);

    if (!constructorA) {
      return NextResponse.json(
        { success: false, error: `Constructor '${aParam}' not found` },
        { status: 404 }
      );
    }
    if (!constructorB) {
      return NextResponse.json(
        { success: false, error: `Constructor '${bParam}' not found` },
        { status: 404 }
      );
    }

    const comparison = compareConstructors(constructorA.constructorId, constructorB.constructorId);

    return NextResponse.json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to compare constructors" },
      { status: 500 }
    );
  }
}

