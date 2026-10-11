import type { Metadata } from "next";
import { calculateDriverCareerStats } from "@/services/driverAnalytics";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const stats = calculateDriverCareerStats(params.id);
    if (stats?.driver) {
      const name = stats.driver.fullName;
      return {
        title: `${name} | F1 Career Analytics`,
        description: `Formula 1 career statistics, race performance, championship history and analytics for ${name}. Wins: ${stats.summary.wins}, Podiums: ${stats.summary.podiums}, Championships: ${stats.titles}.`,
        openGraph: {
          title: `${name} | F1 Career Analytics`,
          description: `Formula 1 career statistics, race performance, championship history and analytics for ${name}.`,
        },
        twitter: {
          card: "summary_large_image",
          title: `${name} | F1 Career Analytics`,
          description: `Formula 1 career statistics, race performance, championship history and analytics for ${name}.`,
        },
      };
    }
  } catch (e) {
    // Fallback if data not loaded
  }

  return {
    title: "Driver Profile | F1 Career Analytics",
    description: "Formula 1 career statistics, race performance, championship history and analytics.",
  };
}

export default function DriverDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

