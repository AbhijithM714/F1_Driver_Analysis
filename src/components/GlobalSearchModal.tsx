"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, User, Flag, Shield, Compass, Calendar, Clock, ArrowRight } from "lucide-react";

interface SearchItem {
  id: string;
  category: "driver" | "constructor" | "circuit" | "race" | "page";
  title: string;
  subtitle: string;
  badge?: string;
  href: string;
  color?: string;
  flag?: string;
}

const DEFAULT_PAGES: SearchItem[] = [
  { id: "p-dash", title: "Live Race Overview Dashboard", subtitle: "Race pace, tyre stints & DRS", category: "page", href: "/dashboard", badge: "Live" },
  { id: "p-telemetry", title: "High-Frequency Telemetry Viewer", subtitle: "Speed, Throttle, Brake, Gear, RPM, DRS", category: "page", href: "/telemetry", badge: "Analysis" },
  { id: "p-drivers", title: "Drivers Roster & Career Profiles", subtitle: "Starts, wins, podiums, career radar", category: "page", href: "/drivers", badge: "Roster" },
  { id: "p-constructors", title: "Constructors & Team Reliability", subtitle: "Points, pit efficiency, development curves", category: "page", href: "/constructors", badge: "Teams" },
  { id: "p-circuits", title: "Circuit Catalog & Track Profiles", subtitle: "Lap records, track geometry, GP history", category: "page", href: "/circuits", badge: "Circuits" },
  { id: "p-replay", title: "Race Replay Simulation", subtitle: "Lap-by-lap running order and interval gaps", category: "page", href: "/race-replay", badge: "Simulation" },
  { id: "p-tyres", title: "Tyre Strategy & Degradation", subtitle: "Compound life, degradation curves & pit windows", category: "page", href: "/tyres", badge: "Strategy" },
  { id: "p-qualifying", title: "Qualifying Delta & Sector Gaps", subtitle: "Q1, Q2, Q3 progression and pole comparisons", category: "page", href: "/qualifying", badge: "Qualifying" },
  { id: "p-championship", title: "Championship Standings & Forecast", subtitle: "Official points trajectory & title clinching", category: "page", href: "/championship", badge: "Standings" },
  { id: "p-records", title: "All-Time Historical Records", subtitle: "Dynamic win streaks, poles, titles & records", category: "page", href: "/records", badge: "Records" },
  { id: "p-favorites", title: "Favorites & Bookmarked Roster", subtitle: "Saved drivers, constructors, and circuits", category: "page", href: "/favorites", badge: "Saved" },
  { id: "p-about", title: "About F1 Analytics Platform", subtitle: "Architecture, data sources, objectives & tech stack", category: "page", href: "/about", badge: "System" },
];

const RECENT_SEARCHES_KEY = "f1_recent_searches_v1";

export default function GlobalSearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "driver" | "constructor" | "circuit" | "race">("all");
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Load recents
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch (e) {
      // ignore
    }
  }, []);

  const saveRecent = (q: string) => {
    const clean = q.trim();
    if (!clean) return;
    try {
      const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  // Fetch search items from API
  useEffect(() => {
    if (!isOpen) return;

    if (!query.trim()) {
      setSearchResults(DEFAULT_PAGES);
      setSelectedIndex(0);
      return;
    }

    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query)}&type=${selectedCategory}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            // Also match pages
            const matchingPages = DEFAULT_PAGES.filter(
              (p) =>
                p.title.toLowerCase().includes(query.toLowerCase()) ||
                p.subtitle.toLowerCase().includes(query.toLowerCase())
            );
            setSearchResults([...json.data, ...matchingPages]);
            setSelectedIndex(0);
          }
        })
        .catch(() => {
          // fallback to client page search
          const matchingPages = DEFAULT_PAGES.filter(
            (p) =>
              p.title.toLowerCase().includes(query.toLowerCase()) ||
              p.subtitle.toLowerCase().includes(query.toLowerCase())
          );
          setSearchResults(matchingPages);
          setSelectedIndex(0);
        });
    }, 150);

    return () => clearTimeout(timer);
  }, [query, selectedCategory, isOpen]);

  // Keyboard Navigation: ArrowUp, ArrowDown, Enter, Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          handleSelect(searchResults[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, searchResults, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const handleSelect = (item: SearchItem) => {
    if (query.trim()) saveRecent(query.trim());
    onClose();
    router.push(item.href);
  };

  const getIcon = (category: SearchItem["category"]) => {
    switch (category) {
      case "driver":
        return <User className="w-4 h-4 text-red-500" />;
      case "constructor":
        return <Shield className="w-4 h-4 text-cyan-400" />;
      case "circuit":
        return <Compass className="w-4 h-4 text-emerald-400" />;
      case "race":
        return <Flag className="w-4 h-4 text-amber-400" />;
      default:
        return <Calendar className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-3 sm:px-4 bg-black/85 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-zinc-800/80 bg-zinc-900/40">
          <Search className="w-5 h-5 text-zinc-400 mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search drivers (VER, #44), teams (Ferrari), circuits (Monza), races..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 rounded">
            ESC
          </kbd>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-zinc-900 bg-zinc-950/60 overflow-x-auto text-xs">
          {(
            [
              { id: "all", label: "All" },
              { id: "driver", label: "Drivers" },
              { id: "constructor", label: "Constructors" },
              { id: "circuit", label: "Circuits" },
              { id: "race", label: "Grands Prix" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition-colors whitespace-nowrap ${
                selectedCategory === tab.id
                  ? "bg-[#E10600] text-white font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Recent Searches (when query empty) */}
        {!query && recentSearches.length > 0 && (
          <div className="px-4 py-2 bg-zinc-900/30 border-b border-zinc-900 flex items-center gap-2 text-xs overflow-x-auto">
            <span className="text-[10px] uppercase font-mono text-zinc-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Recent:
            </span>
            {recentSearches.map((term) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 text-[11px] font-mono whitespace-nowrap"
              >
                {term}
              </button>
            ))}
          </div>
        )}

        {/* Results List */}
        <div
          ref={resultsContainerRef}
          className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-zinc-900/40"
        >
          {searchResults.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              <p className="mb-2">No matching telemetry or records found for &ldquo;{query}&rdquo;.</p>
              <p className="text-xs text-zinc-600 font-mono">
                Try searching driver codes like &ldquo;VER&rdquo;, numbers like &ldquo;#44&rdquo;, or team names like &ldquo;Ferrari&rdquo;.
              </p>
            </div>
          ) : (
            searchResults.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={`${item.id}-${index}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors group ${
                    isSelected ? "bg-zinc-900/90 border border-zinc-700/80 shadow-md" : "border border-transparent hover:bg-zinc-900/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800 shrink-0">
                      {getIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-200 group-hover:text-white flex items-center gap-2 truncate">
                        {item.flag && <span>{item.flag}</span>}
                        <span className="truncate">{item.title}</span>
                      </div>
                      <div className="text-xs text-zinc-500 group-hover:text-zinc-400 truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {item.badge && (
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                        {item.badge}
                      </span>
                    )}
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-[#E10600]" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-zinc-900/40 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Formula 1 Racing Intelligence Engine</span>
        </div>
      </div>
    </div>
  );
}
