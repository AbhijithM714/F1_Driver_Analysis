import { NextRequest, NextResponse } from "next/server";
import { getCircuitProfile, resolveCircuit } from "@/services/circuitAnalytics";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const idParam = params.id;
    const circuit = resolveCircuit(idParam);

    if (!circuit) {
      return NextResponse.json(
        { success: false, error: `Circuit '${idParam}' not found` },
        { status: 404 }
      );
    }

    const profile = getCircuitProfile(circuit.circuitId);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch circuit profile" },
      { status: 500 }
    );
  }
}

