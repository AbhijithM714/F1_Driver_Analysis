"use client";

import { useState, useEffect } from "react";

export type FavoriteType = "driver" | "constructor" | "circuit";

export interface FavoriteItem {
  id: string; // driverRef, constructorRef, or circuitRef
  type: FavoriteType;
  name: string;
  subtitle?: string;
  color?: string;
  flag?: string;
  code?: string;
  savedAt: number;
}

const STORAGE_KEY = "f1_platform_favorites_v1";
const SYNC_EVENT = "f1_favorites_updated";

export function getFavoritesFromStorage(): FavoriteItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to read favorites from localStorage", e);
    return [];
  }
}

export function saveFavoritesToStorage(items: FavoriteItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: items }));
  } catch (e) {
    console.error("Failed to save favorites to localStorage", e);
  }
}

export function toggleFavorite(item: Omit<FavoriteItem, "savedAt">): boolean {
  const current = getFavoritesFromStorage();
  const exists = current.some((f) => f.id === item.id && f.type === item.type);

  let updated: FavoriteItem[];
  if (exists) {
    updated = current.filter((f) => !(f.id === item.id && f.type === item.type));
  } else {
    updated = [{ ...item, savedAt: Date.now() }, ...current];
  }

  saveFavoritesToStorage(updated);
  return !exists;
}

export function isFavorite(type: FavoriteType, id: string): boolean {
  const current = getFavoritesFromStorage();
  return current.some((f) => f.type === type && f.id.toLowerCase() === id.toLowerCase());
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setFavorites(getFavoritesFromStorage());
    setIsReady(true);

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<FavoriteItem[]>;
      if (customEvent.detail) {
        setFavorites(customEvent.detail);
      } else {
        setFavorites(getFavoritesFromStorage());
      }
    };

    window.addEventListener(SYNC_EVENT, handleSync);
    window.addEventListener("storage", handleSync);

    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const toggle = (item: Omit<FavoriteItem, "savedAt">) => {
    return toggleFavorite(item);
  };

  const check = (type: FavoriteType, id: string) => {
    return favorites.some((f) => f.type === type && f.id.toLowerCase() === id.toLowerCase());
  };

  return {
    favorites,
    isReady,
    toggle,
    check,
    drivers: favorites.filter((f) => f.type === "driver"),
    constructors: favorites.filter((f) => f.type === "constructor"),
    circuits: favorites.filter((f) => f.type === "circuit"),
  };
}

