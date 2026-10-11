import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Formula 1 World Championship Standings",
  description:
    "Dynamic driver and constructor championship standings, round-by-round progression charts, and title clinching scenarios from 1950 to 2024.",
  openGraph: {
    title: "Formula 1 World Championship Standings | F1 Race Analytics",
    description: "Dynamic driver and constructor championship standings and round-by-round progression.",
  },
};

export default function ChampionshipLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

