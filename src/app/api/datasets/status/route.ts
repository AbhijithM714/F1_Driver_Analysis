import { NextResponse } from "next/server";
import { getDatasetCatalog } from "@/services/datasetCatalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = getDatasetCatalog();
    const result: Record<string, { isLoaded: boolean; rowCount: number; fileName: string; sizeBytes: number; lastModified: string | null; description: string; requiredColumns: string[]; sourceUrl: string }> = {};

    catalog.datasets.forEach((d) => {
      const key = d.fileName.replace(/\.(csv|json)$/, "");
      result[key] = {
        isLoaded: d.exists,
        rowCount: d.rowCount,
        fileName: d.fileName,
        sizeBytes: d.sizeBytes,
        lastModified: d.lastModified,
        description: d.description,
        requiredColumns: d.requiredColumns,
        sourceUrl: d.sourceUrl,
      };
    });

    return NextResponse.json({
      success: true,
      summary: catalog.summary,
      data: result,
      datasets: catalog.datasets,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch dataset status" },
      { status: 500 }
    );
  }
}
