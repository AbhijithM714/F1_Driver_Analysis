import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Race Analytics & Grand Prix Detail",
  description:
    "Official Grand Prix classification, interactive lap progressions, pit stop durations, and race pace analytics mapped directly from FIA timing datasets.",
  openGraph: {
    title: "Grand Prix Race Analytics | F1 Race Analytics",
    description: "Official Grand Prix classification, interactive lap charts, and pit stop analysis.",
  },
};

export default function RaceAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

