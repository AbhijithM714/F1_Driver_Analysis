import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About the Project | Formula 1 Race Analytics Platform",
  description:
    "Engineering architecture, technology stack, dataset ingestion, and future machine learning roadmap for the Formula 1 Race Analytics Platform.",
  openGraph: {
    title: "About | F1 Race Analytics Platform",
    description: "Engineering architecture, technology stack, and zero synthetic data methodology.",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

