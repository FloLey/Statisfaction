import { useState, useMemo, useEffect } from "react";
import { Activity } from "../api";

export interface ActivityFilters {
  dateRange: "last30" | "last90" | "lastYear" | "all" | "custom";
  customFrom: string;
  customTo: string;
  distanceRange: "all" | "short" | "medium" | "long";
  nameSearch: string;
  runTypes: Set<string>;
}

const DEFAULT_FILTERS: ActivityFilters = {
  dateRange: "all",
  customFrom: "",
  customTo: "",
  distanceRange: "all",
  nameSearch: "",
  runTypes: new Set(),
};

export function useActivityFilters(activities: Activity[]) {
  const [filters, setFilters] = useState<ActivityFilters>(DEFAULT_FILTERS);
  const [debouncedName, setDebouncedName] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedName(filters.nameSearch), 300);
    return () => clearTimeout(t);
  }, [filters.nameSearch]);

  const filteredActivities = useMemo(() => {
    const now = new Date();
    let cutoff: Date | null = null;
    let customFrom: Date | null = null;
    let customTo: Date | null = null;

    if (filters.dateRange === "last30") {
      cutoff = new Date(now.getTime() - 30 * 86400000);
    } else if (filters.dateRange === "last90") {
      cutoff = new Date(now.getTime() - 90 * 86400000);
    } else if (filters.dateRange === "lastYear") {
      cutoff = new Date(now.getTime() - 365 * 86400000);
    } else if (filters.dateRange === "custom") {
      if (filters.customFrom) customFrom = new Date(filters.customFrom);
      if (filters.customTo) customTo = new Date(filters.customTo + "T23:59:59");
    }

    return activities.filter((a) => {
      const d = new Date(a.date);

      if (cutoff && d < cutoff) return false;
      if (customFrom && d < customFrom) return false;
      if (customTo && d > customTo) return false;

      if (filters.distanceRange === "short" && (a.distance_km ?? 0) >= 5)
        return false;
      if (
        filters.distanceRange === "medium" &&
        ((a.distance_km ?? 0) < 5 || (a.distance_km ?? 0) >= 12)
      )
        return false;
      if (filters.distanceRange === "long" && (a.distance_km ?? 0) < 12)
        return false;

      if (
        debouncedName &&
        !a.name.toLowerCase().includes(debouncedName.toLowerCase())
      )
        return false;

      if (filters.runTypes.size > 0 && !filters.runTypes.has(a.run_type ?? ""))
        return false;

      return true;
    });
  }, [
    activities,
    filters.dateRange,
    filters.customFrom,
    filters.customTo,
    filters.distanceRange,
    filters.runTypes,
    debouncedName,
  ]);

  const isFiltered =
    filters.dateRange !== "all" ||
    filters.distanceRange !== "all" ||
    filters.nameSearch !== "" ||
    filters.runTypes.size > 0;

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  return { filters, setFilters, filteredActivities, isFiltered, clearFilters };
}
