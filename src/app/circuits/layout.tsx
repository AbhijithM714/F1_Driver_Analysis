import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "F1 Circuits & Track Directory",
  description:
    "Explore all Formula 1 Grand Prix circuits, track lengths, historical winners, constructor dominance, and official lap records.",
  openGraph: {
    title: "Formula 1 Circuits Directory | F1 Race Analytics",
    description: "Explore all Formula 1 Grand Prix circuits, track lengths, and historical winners.",
  },
};

export default function CircuitsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

