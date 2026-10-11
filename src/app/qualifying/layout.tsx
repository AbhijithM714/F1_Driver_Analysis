import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Qualifying Delta & Sector Progression",
  description:
    "Authentic qualifying classifications, elimination thresholds, pole margins, and Q1, Q2, Q3 shootout timings from official records.",
  openGraph: {
    title: "Qualifying Delta & Shootout Analysis | F1 Race Analytics",
    description: "Authentic qualifying classifications, elimination thresholds, and pole position times.",
  },
};

export default function QualifyingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

