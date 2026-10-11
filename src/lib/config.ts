/**
 * Centralized Application & Environment Configuration
 * ---------------------------------------------------
 * Reads from environment variables with safe production defaults.
 */

export const APP_CONFIG = {
  name:
    process.env.NEXT_PUBLIC_APP_NAME ||
    process.env.APP_NAME ||
    "Formula 1 Race Analytics Platform",
  shortName: "F1 Race Analytics",
  version:
    process.env.NEXT_PUBLIC_APP_VERSION ||
    process.env.APP_VERSION ||
    "1.0.0",
  baseUrl: (
    process.env.NEXT_PUBLIC_BASE_URL || "https://f1-race-analytics.vercel.app"
  ).replace(/\/$/, ""),
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
  dataDirectory: process.env.DATA_DIRECTORY || "data",
  author: process.env.NEXT_PUBLIC_AUTHOR_NAME || "Abhijith",
  githubUrl:
    process.env.NEXT_PUBLIC_GITHUB_URL ||
    "https://github.com/AbhijithM714/F1_Driver_Analysis",
  liveDemoUrl:
    process.env.NEXT_PUBLIC_LIVE_DEMO_URL ||
    "https://f1-race-analytics.vercel.app",
  license: "MIT",
} as const;

