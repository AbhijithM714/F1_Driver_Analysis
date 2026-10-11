export interface TeamMeta {
  id: string;
  name: string;
  shortName: string;
  color: string;
  accentColor: string;
  textColor: string;
}

export const F1_TEAMS: Record<string, TeamMeta> = {
  ferrari: {
    id: "ferrari",
    name: "Scuderia Ferrari",
    shortName: "Ferrari",
    color: "#E80020",
    accentColor: "#FFF200",
    textColor: "#FFFFFF",
  },
  red_bull: {
    id: "red_bull",
    name: "Oracle Red Bull Racing",
    shortName: "Red Bull",
    color: "#3671C6",
    accentColor: "#EA1D2D",
    textColor: "#FFFFFF",
  },
  mercedes: {
    id: "mercedes",
    name: "Mercedes-AMG PETRONAS F1 Team",
    shortName: "Mercedes",
    color: "#27F4D2",
    accentColor: "#C0C0C0",
    textColor: "#000000",
  },
  mclaren: {
    id: "mclaren",
    name: "McLaren Formula 1 Team",
    shortName: "McLaren",
    color: "#FF8000",
    accentColor: "#47C7FC",
    textColor: "#000000",
  },
  aston_martin: {
    id: "aston_martin",
    name: "Aston Martin Aramco F1 Team",
    shortName: "Aston Martin",
    color: "#229971",
    accentColor: "#CEDC00",
    textColor: "#FFFFFF",
  },
  alpine: {
    id: "alpine",
    name: "BWT Alpine F1 Team",
    shortName: "Alpine",
    color: "#FF87BC",
    accentColor: "#0093CC",
    textColor: "#000000",
  },
  williams: {
    id: "williams",
    name: "Williams Racing",
    shortName: "Williams",
    color: "#64C4FF",
    accentColor: "#041E42",
    textColor: "#000000",
  },
  haas: {
    id: "haas",
    name: "MoneyGram Haas F1 Team",
    shortName: "Haas",
    color: "#E6002B",
    accentColor: "#B6BABD",
    textColor: "#FFFFFF",
  },
  sauber: {
    id: "sauber",
    name: "Stake F1 Team Kick Sauber",
    shortName: "Sauber",
    color: "#52E252",
    accentColor: "#000000",
    textColor: "#000000",
  },
  rb: {
    id: "rb",
    name: "Visa Cash App RB F1 Team",
    shortName: "VCARB",
    color: "#6692FF",
    accentColor: "#FFFFFF",
    textColor: "#FFFFFF",
  },
};

export const TYRE_COMPOUNDS = {
  SOFT: { name: "Soft", code: "S", color: "#E80020", bg: "rgba(232, 0, 32, 0.15)", border: "#E80020" },
  MEDIUM: { name: "Medium", code: "M", color: "#FFD700", bg: "rgba(255, 215, 0, 0.15)", border: "#FFD700" },
  HARD: { name: "Hard", code: "H", color: "#FFFFFF", bg: "rgba(255, 255, 255, 0.15)", border: "#FFFFFF" },
  INTERMEDIATE: { name: "Intermediate", code: "I", color: "#39B54A", bg: "rgba(57, 181, 74, 0.15)", border: "#39B54A" },
  WET: { name: "Full Wet", code: "W", color: "#00AEEF", bg: "rgba(0, 174, 239, 0.15)", border: "#00AEEF" },
};

/** deterministic accent colour for constructors without an official theme entry (styling only) */
export function hashColor(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const palette = [
    "#E10600", "#FF8000", "#27F4D2", "#3671C6", "#229971", "#FF87BC", "#64C4FF",
    "#52E252", "#B6BABD", "#FFD700", "#A855F7", "#F97316", "#14B8A6", "#EC4899",
  ];
  return palette[h % palette.length];
}

export function getTeamColor(teamId?: string): string {
  if (!teamId) return "#E10600";
  const normalized = teamId.toLowerCase().replace(/[\s-]/g, "_");
  return F1_TEAMS[normalized]?.color || hashColor(normalized);
}

export function formatTime(seconds?: number): string {
  if (!seconds || isNaN(seconds)) return "--:--.---";
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${parseFloat(secs) < 10 ? "0" : ""}${secs}`;
}

