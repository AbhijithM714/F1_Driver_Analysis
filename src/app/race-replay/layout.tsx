import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive Grand Prix Race Replay",
  description:
    "Experimental lap-by-lap race replay simulation with live interval gaps, driver position changes, and pit stop tracker powered by authentic lap times.",
  openGraph: {
    title: "Grand Prix Race Replay Simulation | F1 Race Analytics",
    description: "Lap-by-lap race replay simulation with live gaps, positions, and pit stop tracker.",
  },
};

export default function RaceReplayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

