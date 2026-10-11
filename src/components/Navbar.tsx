"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Database,
  Menu,
  X,
  Heart,
  ChevronDown,
} from "lucide-react";
import { useDatasetStore } from "@/lib/datasetStore";
import { useFavorites } from "@/lib/favorites";
import GlobalSearchModal from "./GlobalSearchModal";

const PRIMARY_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/drivers", label: "Drivers" },
  { href: "/constructors", label: "Constructors" },
  { href: "/circuits", label: "Circuits" },
  { href: "/race-analytics", label: "Race Analytics" },
  { href: "/telemetry", label: "Telemetry" },
  { href: "/tyres", label: "Tyre Strategy" },
  { href: "/qualifying", label: "Qualifying" },
  { href: "/championship", label: "Championship" },
  { href: "/records", label: "Records" },
];

const MORE_LINKS = [
  { href: "/constructor-comparison", label: "Constructor Comparison" },
  { href: "/race-replay", label: "Race Replay Simulator" },
  { href: "/favorites", label: "Saved Favorites" },
  { href: "/about", label: "About Platform" },
  { href: "/data-manager", label: "Dataset Catalog & Hub" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const { isClient, loadedCount, totalCount } = useDatasetStore();
  const { favorites } = useFavorites();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#080808]/90 backdrop-blur-xl transition-all">
        {/* Top F1 Red Racing Accent Line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-red-600 via-red-500 to-transparent" />

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-black text-white italic tracking-tighter text-sm shadow-glow-red group-hover:scale-105 transition-transform">
                F1
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-white group-hover:text-red-400 transition-colors">
                  APEX <span className="font-light text-zinc-400">ANALYTICS</span>
                </span>
                <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">
                  Engineering Telemetry
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center space-x-1">
              {PRIMARY_LINKS.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? "bg-zinc-800/80 text-white border border-zinc-700/60 shadow-sm"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* More Dropdown */}
              <div ref={moreRef} className="relative">
                <button
                  onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    moreDropdownOpen || MORE_LINKS.some((l) => pathname === l.href)
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60"
                  }`}
                >
                  <span>More</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {moreDropdownOpen && (
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-1 w-52 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl py-1 z-50 divide-y divide-zinc-900"
                  >
                    <div className="py-1">
                      {MORE_LINKS.slice(0, 3).map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMoreDropdownOpen(false)}
                          className={`block px-3 py-2 text-xs transition-colors ${
                            pathname === link.href
                              ? "bg-zinc-900 text-white font-semibold"
                              : "text-zinc-300 hover:text-white hover:bg-zinc-900/80"
                          }`}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                    <div className="py-1">
                      {MORE_LINKS.slice(3).map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMoreDropdownOpen(false)}
                          className={`block px-3 py-2 text-xs transition-colors ${
                            pathname === link.href
                              ? "bg-zinc-900 text-white font-semibold"
                              : "text-zinc-300 hover:text-white hover:bg-zinc-900/80"
                          }`}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Right Action Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Favorites shortcut */}
              <Link
                href="/favorites"
                title="View Favorites"
                className="relative p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-red-400 transition-colors"
              >
                <Heart className={`w-3.5 h-3.5 ${favorites.length > 0 ? "fill-red-500 text-red-500" : ""}`} />
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E10600] text-white text-[9px] font-mono font-bold flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </Link>

              {/* Global Search Button */}
              <button
                onClick={() => setSearchModalOpen(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200 transition-colors"
                title="Search drivers, circuits, teams (Cmd+K)"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-sans">Search</span>
                <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 bg-zinc-950 border border-zinc-800 rounded">
                  ⌘K
                </kbd>
              </button>

              {/* Data Ingestion Status Badge */}
              <Link
                href="/data-manager"
                className={`hidden md:flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
                  isClient && loadedCount > 0
                    ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-400 hover:bg-emerald-950/60"
                    : "bg-red-950/30 border-red-900/60 text-red-400 hover:bg-red-950/50"
                }`}
                title="Manage uploaded F1 datasets"
              >
                <Database className="w-3.5 h-3.5" />
                <span>
                  {isClient ? `${loadedCount}/${totalCount}` : "DATA"}
                </span>
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isClient && loadedCount > 0 ? "bg-emerald-400" : "bg-red-500"
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isClient && loadedCount > 0 ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  />
                </span>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-zinc-800 bg-zinc-950/98 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-1 max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchModalOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-300 bg-zinc-900 mb-3 border border-zinc-800"
            >
              <Search className="w-4 h-4 text-zinc-400" />
              <span>Search F1 Telemetry & Drivers...</span>
            </button>

            <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 px-3 py-1 font-semibold">
              Core Modules
            </div>
            {PRIMARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-[#E10600] text-white font-semibold"
                    : "text-zinc-300 hover:text-white hover:bg-zinc-900"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 px-3 pt-3 pb-1 font-semibold border-t border-zinc-900 mt-2">
              Advanced Analysis
            </div>
            {MORE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-[#E10600] text-white font-semibold"
                    : "text-zinc-300 hover:text-white hover:bg-zinc-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Global Search Dialog */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </>
  );
}
