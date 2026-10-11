import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "F1 Constructors & Teams Analytics",
  description:
    "Formula 1 constructor championship standings, race win percentages, reliability ratings, and historical team profiles.",
  openGraph: {
    title: "Formula 1 Constructors Directory | F1 Race Analytics",
    description: "Formula 1 constructor championship standings, race win percentages, and reliability ratings.",
  },
};

export default function ConstructorsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

