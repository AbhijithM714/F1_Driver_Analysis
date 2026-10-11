import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "F1 Drivers Directory & Career Analytics",
  description:
    "Explore all Formula 1 drivers, career race wins, podiums, championship titles, and historical telemetry data with zero synthetic data.",
  openGraph: {
    title: "Formula 1 Drivers Directory | F1 Race Analytics",
    description: "Explore all Formula 1 drivers, career race wins, podiums, and championship records.",
  },
};

export default function DriversLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

