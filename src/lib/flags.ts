/**
 * Flag lookup tables (client-safe: no filesystem access).
 * NATIONALITY_FLAGS - Ergast `nationality` values (drivers / constructors)
 * COUNTRY_FLAGS     - Ergast circuit `country` values
 */
export const NATIONALITY_FLAGS: Record<string, string> = {
  American: "🇺🇸",
  "American-Italian": "🇺🇸",
  Argentine: "🇦🇷",
  "Argentine-Italian": "🇦🇷",
  Argentinian: "🇦🇷",
  Australian: "🇦🇺",
  Austrian: "🇦🇹",
  Belgian: "🇧🇪",
  Brazilian: "🇧🇷",
  British: "🇬🇧",
  Canadian: "🇨🇦",
  Chilean: "🇨🇱",
  Chinese: "🇨🇳",
  Colombian: "🇨🇴",
  Czech: "🇨🇿",
  Danish: "🇩🇰",
  Dutch: "🇳🇱",
  "East German": "🇩🇪",
  Finnish: "🇫🇮",
  French: "🇫🇷",
  German: "🇩🇪",
  "Hong Kong": "🇭🇰",
  Hungarian: "🇭🇺",
  Indian: "🇮🇳",
  Indonesian: "🇮🇩",
  Irish: "🇮🇪",
  Italian: "🇮🇹",
  Japanese: "🇯🇵",
  Liechtensteiner: "🇱🇮",
  Malaysian: "🇲🇾",
  Mexican: "🇲🇽",
  Monegasque: "🇲🇨",
  "New Zealander": "🇳🇿",
  Polish: "🇵🇱",
  Portuguese: "🇵🇹",
  Rhodesian: "🇿🇼",
  Russian: "🇷🇺",
  "South African": "🇿🇦",
  Spanish: "🇪🇸",
  Swedish: "🇸🇪",
  Swiss: "🇨🇭",
  Thai: "🇹🇭",
  Uruguayan: "🇺🇾",
  Venezuelan: "🇻🇪",
};

export const COUNTRY_FLAGS: Record<string, string> = {
  Argentina: "🇦🇷",
  Australia: "🇦🇺",
  Austria: "🇦🇹",
  Azerbaijan: "🇦🇿",
  Bahrain: "🇧🇭",
  Belgium: "🇧🇪",
  Brazil: "🇧🇷",
  Canada: "🇨🇦",
  China: "🇨🇳",
  France: "🇫🇷",
  Germany: "🇩🇪",
  Hungary: "🇭🇺",
  India: "🇮🇳",
  Italy: "🇮🇹",
  Japan: "🇯🇵",
  Korea: "🇰🇷",
  Malaysia: "🇲🇾",
  Mexico: "🇲🇽",
  Monaco: "🇲🇨",
  Morocco: "🇲🇦",
  Netherlands: "🇳🇱",
  Portugal: "🇵🇹",
  Qatar: "🇶🇦",
  Russia: "🇷🇺",
  "Saudi Arabia": "🇸🇦",
  Singapore: "🇸🇬",
  "South Africa": "🇿🇦",
  Spain: "🇪🇸",
  Sweden: "🇸🇪",
  Switzerland: "🇨🇭",
  Turkey: "🇹🇷",
  UAE: "🇦🇪",
  UK: "🇬🇧",
  USA: "🇺🇸",
  "United States": "🇺🇸",
};

export function flagForNationality(nationality?: string | null): string {
  if (!nationality) return "🏁";
  return NATIONALITY_FLAGS[nationality.trim()] || "🏁";
}

export function flagForCountry(country?: string | null): string {
  if (!country) return "🏁";
  return COUNTRY_FLAGS[country.trim()] || "🏁";
}

