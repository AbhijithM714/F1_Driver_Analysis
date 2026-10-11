import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Favorites | F1 Analytics Platform",
  description:
    "Quickly access your bookmarked Formula 1 drivers, constructors, and Grand Prix circuits stored locally in your browser.",
  openGraph: {
    title: "Saved Favorites | F1 Race Analytics",
    description: "Bookmarks for your favorite Formula 1 drivers, constructors, and circuits.",
  },
};

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

