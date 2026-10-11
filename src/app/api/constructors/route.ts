import { NextRequest, NextResponse } from "next/server";
import { getAllConstructors } from "@/lib/f1DataService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter"); // active | historic | all
    const nationality = searchParams.get("nationality");
    const query = searchParams.get("q")?.toLowerCase().trim();

    let constructors = getAllConstructors();

    if (filter === "active") {
      constructors = constructors.filter((c) => c.isCurrentGrid);
    } else if (filter === "historic") {
      constructors = constructors.filter((c) => !c.isCurrentGrid);
    }

    if (nationality) {
      constructors = constructors.filter(
        (c) => c.nationality.toLowerCase() === nationality.toLowerCase()
      );
    }

    if (query) {
      constructors = constructors.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.constructorRef.toLowerCase().includes(query) ||
          c.nationality.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      success: true,
      count: constructors.length,
      data: constructors,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch constructors" },
      { status: 500 }
    );
  }
}
