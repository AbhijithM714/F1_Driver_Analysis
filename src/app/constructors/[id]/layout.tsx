import type { Metadata } from "next";
import { calculateConstructorStats } from "@/services/constructorAnalytics";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const stats = calculateConstructorStats(params.id);
    if (stats) {
      const name = stats.name;
      return {
        title: `${name} Formula 1 Analytics`,
        description: `Formula 1 historical records, race wins, championships, and reliability analytics for ${name}. Wins: ${stats.totalWins}, Podiums: ${stats.totalPodiums}, Championships: ${stats.championships}.`,
        openGraph: {
          title: `${name} Formula 1 Analytics`,
          description: `Historical records, race performance, and constructor analytics for ${name}.`,
        },
        twitter: {
          card: "summary_large_image",
          title: `${name} Formula 1 Analytics`,
          description: `Historical records, race performance, and constructor analytics for ${name}.`,
        },
      };
    }
  } catch (e) {
    // Fallback
  }

  return {
    title: "Constructor Analytics | F1 Team Profile",
    description: "Formula 1 constructor analytics, championship history, and race performance.",
  };
}

export default function ConstructorDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

