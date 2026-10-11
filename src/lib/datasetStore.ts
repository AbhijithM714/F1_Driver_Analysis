"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";
import { DATASET_REQUIREMENTS, DatasetRequirement } from "./datasetRequirements";

const STORAGE_PREFIX = "f1_dataset_";

export interface DatasetStatus {
  id: string;
  name: string;
  isLoaded: boolean;
  rowCount: number;
  lastUpdated?: string;
  missingColumns?: string[];
}

export function getStoredDataset<T = any>(datasetId: string): T[] | null {
  if (typeof window === "undefined") return null;
  try {
    const safeId = datasetId.replace(/[^a-zA-Z0-9_-]/g, "");
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${safeId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredDataset(datasetId: string, data: any[]): void {
  if (typeof window === "undefined") return;
  try {
    const safeId = datasetId.replace(/[^a-zA-Z0-9_-]/g, "");
    localStorage.setItem(`${STORAGE_PREFIX}${safeId}`, JSON.stringify(data));
    localStorage.setItem(`${STORAGE_PREFIX}${safeId}_time`, new Date().toISOString());
    window.dispatchEvent(new Event("f1_dataset_update"));
  } catch {
    // Storage quota exceeded or restricted mode
  }
}

export function removeStoredDataset(datasetId: string): void {
  if (typeof window === "undefined") return;
  const safeId = datasetId.replace(/[^a-zA-Z0-9_-]/g, "");
  localStorage.removeItem(`${STORAGE_PREFIX}${safeId}`);
  localStorage.removeItem(`${STORAGE_PREFIX}${safeId}_time`);
  window.dispatchEvent(new Event("f1_dataset_update"));
}

/**
 * Sanitizes string values to prevent CSV Formula Injection (DDE / spreadsheet macro injection)
 * and strips dangerous control sequences.
 */
function sanitizeCellValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  // Prevent formula execution if exported or rendered in spreadsheet tools (=, +, @, tab, CR)
  // Note: negative numbers like "-1.23" are preserved while non-numeric "-cmd" strings are neutralized
  if (/^[=+@\t\r]/.test(trimmed) || (/^-[^0-9.]/.test(trimmed))) {
    return `'${trimmed}`;
  }
  return trimmed;
}

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB limit

export function validateAndParseDataset(
  requirement: DatasetRequirement,
  fileContent: string
): { success: boolean; data?: any[]; error?: string; missingColumns?: string[] } {
  try {
    if (!fileContent || typeof fileContent !== "string") {
      return { success: false, error: "Empty or unreadable file payload." };
    }

    if (fileContent.length > MAX_UPLOAD_BYTES) {
      return {
        success: false,
        error: "Dataset exceeds the 25 MB browser ingestion limit.",
      };
    }

    if (fileContent.includes("\0")) {
      return {
        success: false,
        error: "Binary file detected. Only UTF-8 CSV or JSON datasets are permitted.",
      };
    }

    let rows: any[] = [];
    const trimmed = fileContent.trim();

    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      rows = Array.isArray(parsed) ? parsed : [parsed];
    } else {
      const parsedCsv = Papa.parse(trimmed, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
      });

      if (parsedCsv.errors && parsedCsv.errors.length > 0) {
        const errorMsg = parsedCsv.errors[0]?.message || "CSV Parsing Error";
        return { success: false, error: `Invalid CSV format: ${errorMsg}` };
      }
      rows = parsedCsv.data as any[];
    }

    if (!rows || rows.length === 0) {
      return { success: false, error: "The uploaded file contains no data rows." };
    }

    const availableColumns = Object.keys(rows[0] || {});
    const requiredCols = requirement.expectedColumns.filter((c) => c.required);
    const missingColumns = requiredCols
      .map((c) => c.name)
      .filter((reqCol) => !availableColumns.some((ac) => ac.toLowerCase() === reqCol.toLowerCase()));

    if (missingColumns.length > 0) {
      return {
        success: false,
        error: `Missing required columns: ${missingColumns.join(", ")}`,
        missingColumns,
      };
    }

    // Sanitize all rows against CSV injection and prototype pollution keys
    const sanitizedRows = rows.map((row) => {
      const cleanRow: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row || {})) {
        if (k === "__proto__" || k === "constructor" || k === "prototype") continue;
        cleanRow[k] = sanitizeCellValue(v);
      }
      return cleanRow;
    });

    return { success: true, data: sanitizedRows };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to process dataset file." };
  }
}

const REQUIREMENT_FILE_KEYS: Record<string, string[]> = {
  drivers: ["drivers"],
  constructors: ["constructors"],
  circuits: ["circuits"],
  race_results: ["results", "race_results"],
  qualifying_results: ["qualifying", "qualifying_results"],
  sprint_results: ["sprint_results"],
  lap_times: ["lap_times"],
  pit_stops: ["pit_stops"],
  tyre_stints: ["tyre_stints"],
  telemetry: ["telemetry"],
  weather: ["weather"],
  championship_points: ["driver_standings", "constructor_standings", "championship_points"],
  fastest_laps: ["fastest_laps"],
  sector_times: ["sector_times"],
  safety_car_events: ["safety_car_events"],
  drs_usage: ["drs_usage"],
  penalties: ["penalties"],
  track_maps: ["track_maps"],
  driver_images: ["driver_images"],
  team_logos: ["team_logos"],
};

export function useDatasetStore() {
  const [statuses, setStatuses] = useState<Record<string, DatasetStatus>>({});
  const [isClient, setIsClient] = useState(false);

  const refresh = () => {
    if (typeof window === "undefined") return;
    const newStatuses: Record<string, DatasetStatus> = {};

    DATASET_REQUIREMENTS.forEach((req) => {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${req.id}`);
      const time = localStorage.getItem(`${STORAGE_PREFIX}${req.id}_time`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          newStatuses[req.id] = {
            id: req.id,
            name: req.name,
            isLoaded: true,
            rowCount: Array.isArray(parsed) ? parsed.length : 1,
            lastUpdated: time || undefined,
          };
        } catch {
          newStatuses[req.id] = {
            id: req.id,
            name: req.name,
            isLoaded: false,
            rowCount: 0,
          };
        }
      } else {
        newStatuses[req.id] = {
          id: req.id,
          name: req.name,
          isLoaded: false,
          rowCount: 0,
        };
      }
    });

    setStatuses(newStatuses);
  };

  useEffect(() => {
    setIsClient(true);
    refresh();

    // Sync detected datasets from server
    fetch("/api/datasets/status")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setStatuses((prev) => {
            const updated = { ...prev };
            DATASET_REQUIREMENTS.forEach((req) => {
              const candidateKeys = REQUIREMENT_FILE_KEYS[req.id] || [req.id];
              for (const k of candidateKeys) {
                const s = json.data[k];
                if (s && s.isLoaded) {
                  updated[req.id] = {
                    id: req.id,
                    name: req.name,
                    isLoaded: true,
                    rowCount: s.rowCount,
                    lastUpdated: `Active (data/${s.fileName})`,
                  };
                  break;
                }
              }
            });
            return updated;
          });
        }
      })
      .catch(() => {
        // Silent fallback when offline
      });

    const handler = () => refresh();
    window.addEventListener("f1_dataset_update", handler);
    window.addEventListener("storage", handler);

    return () => {
      window.removeEventListener("f1_dataset_update", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const uploadFile = async (requirement: DatasetRequirement, fileContent: string) => {
    const result = validateAndParseDataset(requirement, fileContent);
    if (result.success && result.data) {
      saveStoredDataset(requirement.id, result.data);
      return { success: true, count: result.data.length };
    }
    return { success: false, error: result.error, missingColumns: result.missingColumns };
  };

  const getDataset = <T = any>(datasetId: string): T[] | null => {
    return getStoredDataset<T>(datasetId);
  };

  const clearDataset = (datasetId: string) => {
    removeStoredDataset(datasetId);
  };

  const isLoaded = (datasetId: string): boolean => {
    return Boolean(statuses[datasetId]?.isLoaded);
  };

  const loadedCount = DATASET_REQUIREMENTS.filter((req) => Boolean(statuses[req.id]?.isLoaded)).length;
  const totalCount = DATASET_REQUIREMENTS.length;

  return {
    isClient,
    statuses,
    loadedCount,
    totalCount,
    isLoaded,
    getDataset,
    uploadFile,
    clearDataset,
    refresh,
  };
}

