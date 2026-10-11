import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tyre Strategy & Degradation Engine",
  description:
    "Pirelli tyre compound degradation models, optimal pit stop windows, and stint progression timelines calculated from actual session telemetry.",
  openGraph: {
    title: "Tyre Strategy & Degradation Engine | F1 Race Analytics",
    description: "Pirelli compound degradation models, optimal pit stop windows, and stint progression.",
  },
};

export default function TyresLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

