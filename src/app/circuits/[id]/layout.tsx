import type { Metadata } from "next";
import { getCircuitProfile } from "@/services/circuitAnalytics";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  try {
    const profile = getCircuitProfile(params.id);
    if (profile?.circuit) {
      const name = profile.circuit.name;
      const country = profile.circuit.country;
      return {
        title: `${name} (${country}) | F1 Circuit Analytics`,
        description: `Formula 1 circuit profile for ${name}: historical winners, constructor records, track characteristics, and Grand Prix history.`,
        openGraph: {
          title: `${name} | F1 Circuit Profile`,
          description: `Track profile, winners, and lap records for ${name} (${country}).`,
        },
        twitter: {
          card: "summary_large_image",
          title: `${name} | F1 Circuit Profile`,
          description: `Track profile, winners, and lap records for ${name} (${country}).`,
        },
      };
    }
  } catch (e) {
    // Fallback
  }

  return {
    title: "Circuit Profile | F1 Track Analytics",
    description: "Formula 1 circuit analytics, track history, and Grand Prix winners.",
  };
}

export default function CircuitDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

