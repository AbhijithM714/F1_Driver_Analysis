import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080808",
        surface: {
          50: "#181818",
          100: "#141414",
          200: "#101010",
          300: "#0d0d0d",
          DEFAULT: "#121212",
        },
        border: "#242424",
        f1: {
          red: "#E10600",
          ferrari: "#E80020",
          mclaren: "#FF8000",
          mercedes: "#27F4D2",
          astonMartin: "#229971",
          redBull: "#3671C6",
          alpine: "#FF87BC",
          alpineBlue: "#0093CC",
          williams: "#64C4FF",
          haas: "#E6002B",
          sauber: "#52E252",
          vcarb: "#6692FF",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      backgroundImage: {
        "carbon-mesh": "radial-gradient(#1c1c1c 1px, transparent 1px)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      boxShadow: {
        "glow-red": "0 0 25px -5px rgba(225, 6, 0, 0.4)",
        "glow-cyan": "0 0 25px -5px rgba(39, 244, 210, 0.3)",
        "panel": "0 8px 30px rgba(0, 0, 0, 0.7)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "speed-line": "speedLine 2s linear infinite",
      },
      keyframes: {
        speedLine: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "50%": { opacity: "0.8" },
          "100%": { transform: "translateX(200%)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

