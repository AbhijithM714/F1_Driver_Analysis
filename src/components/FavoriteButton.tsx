"use client";

import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { FavoriteType, isFavorite, toggleFavorite } from "@/lib/favorites";

interface FavoriteButtonProps {
  type: FavoriteType;
  id: string;
  name: string;
  subtitle?: string;
  color?: string;
  flag?: string;
  code?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function FavoriteButton({
  type,
  id,
  name,
  subtitle,
  color,
  flag,
  code,
  className = "",
  size = "md",
}: FavoriteButtonProps) {
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setActive(isFavorite(type, id));

    const handleSync = () => {
      setActive(isFavorite(type, id));
    };

    window.addEventListener("f1_favorites_updated", handleSync);
    return () => window.removeEventListener("f1_favorites_updated", handleSync);
  }, [type, id]);

  if (!mounted) {
    return (
      <button
        aria-label="Add to favorites"
        className={`p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors ${className}`}
      >
        <Heart className="w-4 h-4" />
      </button>
    );
  }

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = toggleFavorite({
      id,
      type,
      name,
      subtitle,
      color,
      flag,
      code,
    });
    setActive(nextState);
  };

  return (
    <button
      onClick={handleToggle}
      title={active ? "Remove from Favorites" : "Add to Favorites"}
      aria-label={active ? "Remove from Favorites" : "Add to Favorites"}
      className={`p-2 rounded-lg transition-all duration-200 border ${
        active
          ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20 shadow-sm shadow-red-500/10"
          : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
      } ${className}`}
    >
      <Heart className={`${iconSizes[size]} ${active ? "fill-red-500" : ""}`} />
    </button>
  );
}

