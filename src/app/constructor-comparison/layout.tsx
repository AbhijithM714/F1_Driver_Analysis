import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Head-to-Head Constructor Comparison",
  description:
    "Compare Formula 1 constructors across all-time race wins, podiums, championships, points, reliability rates, and pit stop execution.",
  openGraph: {
    title: "Constructor Comparison | F1 Race Analytics",
    description: "Compare Formula 1 constructors across wins, podiums, reliability, and points.",
  },
};

export default function ConstructorComparisonLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

