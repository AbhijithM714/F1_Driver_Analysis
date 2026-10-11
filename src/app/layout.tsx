import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import CountdownBanner from "@/components/CountdownBanner";
import Footer from "@/components/Footer";
import { APP_CONFIG } from "@/lib/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_CONFIG.baseUrl),
  title: {
    default: `${APP_CONFIG.name} | Engineering Intelligence`,
    template: `%s | ${APP_CONFIG.shortName}`,
  },
  description:
    "Production-grade Formula 1 engineering analytics platform featuring race telemetry, tyre degradation modeling, dynamic championship standings, and circuit analytics with zero synthetic data.",
  keywords: [
    "Formula 1",
    "F1 Analytics",
    "Telemetry",
    "Tyre Degradation",
    "Pit Wall Intelligence",
    "Grand Prix Classification",
    "Driver Career Statistics",
    "Constructor Performance",
  ],
  authors: [{ name: APP_CONFIG.author }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_CONFIG.baseUrl,
    siteName: APP_CONFIG.name,
    title: `${APP_CONFIG.name} | Apex Telemetry & Pit Wall Intelligence`,
    description:
      "Explore real race pace, Pirelli tyre degradation curves, qualifying sector deltas, and driver telemetry calculated directly from official datasets.",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_CONFIG.name,
    description:
      "Explore real race pace, Pirelli tyre degradation curves, qualifying deltas, and telemetry calculated with zero synthetic data.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#080808] text-zinc-100 antialiased selection:bg-red-600 selection:text-white">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#E10600] focus:text-white focus:font-bold focus:text-xs"
        >
          Skip to main content
        </a>
        <CountdownBanner />
        <Navbar />
        <main id="main-content" className="flex-1 w-full">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}


