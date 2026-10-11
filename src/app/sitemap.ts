import { MetadataRoute } from "next";
import { APP_CONFIG } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = APP_CONFIG.baseUrl;
  const routes = [
    "",
    "/dashboard",
    "/drivers",
    "/constructors",
    "/circuits",
    "/race-analytics",
    "/qualifying",
    "/championship",
    "/records",
    "/tyres",
    "/telemetry",
    "/race-replay",
    "/constructor-comparison",
    "/favorites",
    "/about",
    "/data-manager",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));
}


