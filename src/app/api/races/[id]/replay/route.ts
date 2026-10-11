import { NextRequest, NextResponse } from "next/server";
import { calculateRaceReplay } from "@/services/raceAnalytics";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const GEOJSON_ID_TO_CIRCUIT_REF: Record<string, string> = {
  "bh-2002": "bahrain",
  "sa-2021": "jeddah",
  "au-1953": "albert_park",
  "jp-1962": "suzuka",
  "cn-2004": "shanghai",
  "us-2022": "miami",
  "it-1953": "imola",
  "mc-1929": "monaco",
  "ca-1978": "villeneuve",
  "es-1991": "catalunya",
  "at-1969": "red_bull_ring",
  "gb-1948": "silverstone",
  "hu-1986": "hungaroring",
  "be-1925": "spa",
  "nl-1948": "zandvoort",
  "it-1922": "monza",
  "az-2016": "baku",
  "sg-2008": "marina_bay",
  "us-2012": "americas",
  "mx-1962": "rodriguez",
  "br-1940": "interlagos",
  "us-2023": "vegas",
  "qa-2004": "losail",
  "ae-2009": "yas_marina",
  "fr-1969": "ricard",
  "it-1914": "mugello",
  "pt-2008": "portimao",
  "tr-2005": "istanbul",
  "ru-2014": "sochi",
  "de-1927": "nurburgring",
  "de-1932": "hockenheimring",
  "my-1999": "sepang",
  "fr-1960": "magny_cours",
  "us-1909": "indianapolis",
  "jp-1965": "fuji",
  "kr-2010": "yeongam",
  "in-2011": "buddh",
  "es-2008": "valencia",
  "es-1985": "jerez",
  "pt-1972": "estoril",
  "au-1985": "adelaide",
  "za-1961": "kyalami",
};

let hasSyncedFullGeoJson = false;

async function ensureFullTrackMapsSynced() {
  if (hasSyncedFullGeoJson) return;
  hasSyncedFullGeoJson = true;

  try {
    const trackPath = path.join(process.cwd(), "data", "track_maps.json");
    if (!fs.existsSync(trackPath)) return;

    const existing = JSON.parse(fs.readFileSync(trackPath, "utf-8"));
    // Check if suzuka already has full GeoJSON resolution (>= 60 points)
    if (existing?.suzuka?.coordinates?.length >= 60) {
      return;
    }

    const res = await fetch(
      "https://raw.githubusercontent.com/bacinger/f1-circuits/master/f1-circuits.geojson",
      { cache: "no-store" }
    );
    if (!res.ok) return;

    const geojson = await res.json();
    if (!Array.isArray(geojson?.features)) return;

    let updatedCount = 0;
    for (const feature of geojson.features) {
      const id = feature?.properties?.id;
      const circuitRef = GEOJSON_ID_TO_CIRCUIT_REF[id];
      const rawCoords = feature?.geometry?.coordinates;
      if (!circuitRef || !Array.isArray(rawCoords) || rawCoords.length < 15) continue;

      const coords: [number, number][] = rawCoords.map((pt: number[]) => [
        Math.round(Number(pt[0]) * 100000) / 100000,
        Math.round(Number(pt[1]) * 100000) / 100000,
      ]);

      existing[circuitRef] = {
        name: existing[circuitRef]?.name || feature.properties?.name || circuitRef,
        country: existing[circuitRef]?.country || feature.properties?.location || "",
        lengthKm:
          existing[circuitRef]?.lengthKm ||
          (feature.properties?.length ? Math.round(feature.properties.length / 10) / 100 : 5.0),
        turns: existing[circuitRef]?.turns || 16,
        drsZones: existing[circuitRef]?.drsZones || 2,
        coordinates: coords,
      };
      updatedCount++;
    }

    if (updatedCount > 0) {
      fs.writeFileSync(trackPath, JSON.stringify(existing, null, 2), "utf-8");
    }
  } catch {
    // Non-fatal; fallback to bundled coordinates in data/track_maps.json
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const raceId = Number(params.id);
    if (isNaN(raceId)) {
      return NextResponse.json({ success: false, error: "Invalid race ID" }, { status: 400 });
    }

    await ensureFullTrackMapsSynced();

    const replay = calculateRaceReplay(raceId);

    if (!replay) {
      return NextResponse.json(
        {
          success: false,
          error: "Lap-by-lap timing data is not available for this Grand Prix. Lap replay is available for races from 1996 to present.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: replay,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate race replay" },
      { status: 500 }
    );
  }
}


