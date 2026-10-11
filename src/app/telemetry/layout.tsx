import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "High-Frequency Dual Driver Telemetry",
  description:
    "Synchronized 100Hz ECU telemetry traces: overlay Speed, Throttle, Brake, Gear, RPM, and DRS channels with distance crosshairs and live cursor sync.",
  openGraph: {
    title: "Dual Driver Telemetry Analysis | F1 Race Analytics",
    description: "Overlay 100Hz ECU telemetry traces, speed deltas, throttle and braking crosshairs.",
  },
};

export default function TelemetryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

