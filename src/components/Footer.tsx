import React from "react";
import Link from "next/link";
import { ExternalLink, GitBranch, Globe, ShieldCheck } from "lucide-react";
import { APP_CONFIG } from "@/lib/config";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="w-full bg-[#060606] border-t border-zinc-800/80 text-zinc-400 font-sans text-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Release Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#E10600] flex items-center justify-center font-black text-white text-xs italic">
                F1
              </div>
              <div>
                <span className="font-bold text-zinc-100 tracking-tight block">
                  {APP_CONFIG.name}
                </span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">
                  Version {APP_CONFIG.version} · Production Release
                </span>
              </div>
            </div>
            <p className="text-zinc-500 leading-relaxed text-xs">
              Production-grade Formula 1 telemetry, tyre degradation modeling, 2D circuit replay, and historical analytics engine powered strictly by verified datasets.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ZERO SYNTHETIC DATA POLICY</span>
            </div>
          </div>

          {/* Analytics Modules */}
          <div>
            <h3 className="text-zinc-200 font-semibold mb-3 tracking-wide uppercase text-[11px] font-mono">
              Engineering Modules
            </h3>
            <ul className="space-y-2 text-zinc-400">
              <li><Link href="/dashboard" className="hover:text-red-400 transition-colors">Telemetry & Race Dashboard</Link></li>
              <li><Link href="/telemetry" className="hover:text-red-400 transition-colors">Dual-Car 100Hz Telemetry</Link></li>
              <li><Link href="/tyres" className="hover:text-red-400 transition-colors">Tyre Degradation & Stints</Link></li>
              <li><Link href="/race-replay" className="hover:text-red-400 transition-colors">2D Track Replay Simulator</Link></li>
              <li><Link href="/qualifying" className="hover:text-red-400 transition-colors">Qualifying Delta Analysis</Link></li>
              <li><Link href="/race-analytics" className="hover:text-red-400 transition-colors">Grand Prix Classifications</Link></li>
            </ul>
          </div>

          {/* Standings & History */}
          <div>
            <h3 className="text-zinc-200 font-semibold mb-3 tracking-wide uppercase text-[11px] font-mono">
              Championship & Catalog
            </h3>
            <ul className="space-y-2 text-zinc-400">
              <li><Link href="/drivers" className="hover:text-red-400 transition-colors">Driver Career Analytics</Link></li>
              <li><Link href="/constructors" className="hover:text-red-400 transition-colors">Constructor Profiles</Link></li>
              <li><Link href="/constructor-comparison" className="hover:text-red-400 transition-colors">Constructor Comparison</Link></li>
              <li><Link href="/circuits" className="hover:text-red-400 transition-colors">World Championship Circuits</Link></li>
              <li><Link href="/championship" className="hover:text-red-400 transition-colors">Standings & Clinch Math</Link></li>
              <li><Link href="/records" className="hover:text-red-400 transition-colors">All-Time Historical Records</Link></li>
            </ul>
          </div>

          {/* Project Links, Author & Data Sources */}
          <div>
            <h3 className="text-zinc-200 font-semibold mb-3 tracking-wide uppercase text-[11px] font-mono">
              Project & Repository
            </h3>
            <ul className="space-y-2 text-zinc-400">
              <li>
                <a
                  href={APP_CONFIG.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <GitBranch className="w-3.5 h-3.5 text-red-500" />
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3 text-zinc-600" />
                </a>
              </li>
              <li>
                <a
                  href={APP_CONFIG.liveDemoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Live Demo Deployment</span>
                  <ExternalLink className="w-3 h-3 text-zinc-600" />
                </a>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  Architecture & Documentation
                </Link>
              </li>
              <li>
                <Link href="/data-manager" className="hover:text-white transition-colors">
                  Dataset Governance Center
                </Link>
              </li>
              <li className="pt-1 text-[11px] font-mono text-zinc-500">
                License: <strong className="text-zinc-300">{APP_CONFIG.license}</strong> · Build:{" "}
                <strong className="text-zinc-300">v{APP_CONFIG.version}</strong>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-500 text-[11px]">
          <div>
            © {currentYear} {APP_CONFIG.name} · Released under the{" "}
            <strong className="text-zinc-300">{APP_CONFIG.license} License</strong>. Formula 1 is a trademark of Formula One Licensing B.V.
          </div>
          <div className="font-mono text-zinc-400">
            VERSION {APP_CONFIG.version} · PRODUCTION RELEASE
          </div>
        </div>
      </div>
    </footer>
  );
}
