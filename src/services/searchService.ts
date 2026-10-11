/**
 * Global search service
 * ---------------------
 * Unified search index across Drivers, Constructors, Circuits, and Grand Prix events.
 * Matches code (VER, HAM), numbers (#44, 1), full names, nationality, and circuit cities.
 */
import { CORE_FILES, getDataset, memo } from "./dataStore";
import { flagForNationality } from "@/lib/flags";
import { getTeamColor } from "@/lib/f1Themes";

export type SearchCategory = "driver" | "constructor" | "circuit" | "race";

export interface SearchResultItem {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle: string;
  badge?: string;
  href: string;
  color?: string;
  flag?: string;
}

export function buildSearchIndex(): SearchResultItem[] {
  return memo("unifiedSearchIndex", CORE_FILES, () => {
    const ds = getDataset();
    const items: SearchResultItem[] = [];

    // 1. Drivers
    ds.drivers.forEach((d) => {
      const code = d.code ? d.code.toUpperCase() : "";
      const numStr = d.number ? `#${d.number}` : "";
      const flag = flagForNationality(d.nationality);
      const isChamp = ds.driverChampionByYear.size > 0 && Array.from(ds.driverChampionByYear.values()).includes(d.driverId);

      items.push({
        id: `driver:${d.driverId}`,
        category: "driver",
        title: d.fullName,
        subtitle: [code, numStr, d.nationality].filter(Boolean).join(" · "),
        badge: isChamp ? "World Champion" : code || undefined,
        href: `/drivers/${d.driverRef}`,
        flag,
      });
    });

    // 2. Constructors
    ds.constructors.forEach((c) => {
      const color = getTeamColor(c.constructorRef);
      const isChamp = Array.from(ds.constructorChampionByYear.values()).includes(c.constructorId);

      items.push({
        id: `constructor:${c.constructorId}`,
        category: "constructor",
        title: c.name,
        subtitle: `${c.nationality} Constructor`,
        badge: isChamp ? "Champion Team" : undefined,
        href: `/constructors/${c.constructorRef}`,
        color,
      });
    });

    // 3. Circuits
    ds.circuits.forEach((circ) => {
      const flag = flagForNationality(circ.country);
      items.push({
        id: `circuit:${circ.circuitId}`,
        category: "circuit",
        title: circ.name,
        subtitle: `${circ.location}, ${circ.country}`,
        badge: "Circuit",
        href: `/circuits/${circ.circuitRef}`,
        flag,
      });
    });

    // 4. Races (latest season + historic distinct Grands Prix)
    const distinctGPs = new Map<string, { name: string; latestYear: number; latestRaceId: number }>();
    ds.races.forEach((r) => {
      const cur = distinctGPs.get(r.name);
      if (!cur || r.year > cur.latestYear) {
        distinctGPs.set(r.name, { name: r.name, latestYear: r.year, latestRaceId: r.raceId });
      }
    });

    distinctGPs.forEach((info) => {
      items.push({
        id: `race:${info.latestRaceId}`,
        category: "race",
        title: info.name,
        subtitle: `Latest: ${info.latestYear} Season`,
        badge: "Grand Prix",
        href: `/race-analytics?raceId=${info.latestRaceId}`,
      });
    });

    return items;
  });
}

export function executeSearch(query: string, category: SearchCategory | "all" = "all", limit = 15): SearchResultItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const index = buildSearchIndex();
  const filtered = index.filter((item) => {
    if (category !== "all" && item.category !== category) return false;

    // Direct matches
    const cleanNum = q.replace(/^#/, "");
    const titleMatch = item.title.toLowerCase().includes(q);
    const subMatch = item.subtitle.toLowerCase().includes(q);
    const badgeMatch = item.badge?.toLowerCase().includes(q) ?? false;
    const numMatch = cleanNum && item.subtitle.toLowerCase().includes(`#${cleanNum}`);

    return titleMatch || subMatch || badgeMatch || numMatch;
  });

  // Prioritize exact or prefix matches in title
  filtered.sort((a, b) => {
    const aLower = a.title.toLowerCase();
    const bLower = b.title.toLowerCase();
    const aStarts = aLower.startsWith(q);
    const bStarts = bLower.startsWith(q);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;
    return 0;
  });

  return filtered.slice(0, limit);
}

