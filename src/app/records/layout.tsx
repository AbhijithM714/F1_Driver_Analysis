import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All-Time Historical Records & Milestones",
  description:
    "Dynamic Formula 1 historical records: most race wins, pole positions, world championships, winning streaks, and circuit lap records with zero synthetic data.",
  openGraph: {
    title: "Formula 1 Historical Records & Milestones | F1 Race Analytics",
    description: "Calculated all-time Formula 1 milestones, most wins, pole positions, and championships.",
  },
};

export default function RecordsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

