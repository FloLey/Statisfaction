import { Activity, Split, SplitWithActivity } from "../../api";

// Colors (Tailwind equivalents as hex)
export const COLORS = {
  pace: "#3b82f6", // blue-500
  hr: "#f87171", // red-400
  elevation: "#22c55e", // green-500
  amber: "#f59e0b", // amber-500
  gray: "#9ca3af", // gray-400
};

export function paceTickFormatter(pace: number): string {
  if (pace == null || isNaN(pace)) return "—";
  const mins = Math.floor(pace);
  const secs = Math.round((pace - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function computeMovingAverage(
  values: (number | null)[],
  window: number,
  weights?: (number | null)[],
): (number | null)[] {
  return values.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    if (!weights) {
      const slice = values.slice(start, i + 1).filter((v): v is number => v != null);
      if (slice.length === 0) return null;
      return slice.reduce((a, b) => a + b, 0) / slice.length;
    }
    let weightedSum = 0;
    let totalWeight = 0;
    for (let j = start; j <= i; j++) {
      const v = values[j];
      const w = weights[j];
      if (v != null && w != null && w > 0) {
        weightedSum += v * w;
        totalWeight += w;
      }
    }
    return totalWeight === 0 ? null : weightedSum / totalWeight;
  });
}

function toMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getAllMondays(activities: Activity[]): Date[] {
  if (activities.length === 0) return [];
  const dates = activities.map((a) => new Date(a.date));
  const first = toMonday(
    new Date(Math.min(...dates.map((d) => d.getTime()))),
  );
  const last = toMonday(
    new Date(Math.max(...dates.map((d) => d.getTime()))),
  );
  const mondays: Date[] = [];
  const cur = new Date(first);
  while (cur <= last) {
    mondays.push(new Date(cur));
    cur.setDate(cur.getDate() + 7);
  }
  return mondays;
}

function mondayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function mondayLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export interface WeekBucket {
  week: string;
  totalKm: number;
  startDate: string;
}

export function groupByWeek(activities: Activity[]): WeekBucket[] {
  const map = new Map<string, number>();
  for (const a of activities) {
    if (a.distance_km == null) continue;
    const key = mondayKey(toMonday(new Date(a.date)));
    map.set(key, (map.get(key) ?? 0) + a.distance_km);
  }

  return getAllMondays(activities).map((mon) => {
    const key = mondayKey(mon);
    return {
      week: mondayLabel(mon),
      totalKm: Math.round((map.get(key) ?? 0) * 100) / 100,
      startDate: key,
    };
  });
}

export interface MonthBucket {
  month: string; // "Jan 2026"
  totalKm: number;
  avgPace: number | null;
}

export function groupByMonth(activities: Activity[]): MonthBucket[] {
  const map = new Map<
    string,
    { totalKm: number; totalDuration: number; totalDistance: number; label: string }
  >();

  for (const a of activities) {
    const d = new Date(a.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    const existing = map.get(key);
    if (existing) {
      if (a.distance_km != null) existing.totalKm += a.distance_km;
      if (a.duration_min != null && a.distance_km != null) {
        existing.totalDuration += a.duration_min;
        existing.totalDistance += a.distance_km;
      }
    } else {
      map.set(key, {
        totalKm: a.distance_km ?? 0,
        totalDuration: a.duration_min != null && a.distance_km != null ? a.duration_min : 0,
        totalDistance: a.duration_min != null && a.distance_km != null ? a.distance_km : 0,
        label,
      });
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      month: v.label,
      totalKm: Math.round(v.totalKm * 100) / 100,
      avgPace:
        v.totalDistance > 0
          ? Math.round((v.totalDuration / v.totalDistance) * 100) / 100
          : null,
    }));
}

export interface DistanceBucket {
  label: string;
  count: number;
}

const DISTANCE_RANGES = [
  { label: "0-3 km", min: 0, max: 3 },
  { label: "3-5 km", min: 3, max: 5 },
  { label: "5-8 km", min: 5, max: 8 },
  { label: "8-12 km", min: 8, max: 12 },
  { label: "12-16 km", min: 12, max: 16 },
  { label: "16-21 km", min: 16, max: 21 },
  { label: "21+ km", min: 21, max: Infinity },
];

export function bucketDistances(activities: Activity[]): DistanceBucket[] {
  const counts = DISTANCE_RANGES.map((r) => ({ label: r.label, count: 0 }));
  for (const a of activities) {
    if (a.distance_km == null) continue;
    const idx = DISTANCE_RANGES.findIndex(
      (r) => a.distance_km! >= r.min && a.distance_km! < r.max,
    );
    if (idx >= 0) counts[idx].count++;
  }
  return counts;
}

const IDLE_OUTLIER_DURATION_MIN = 5;
const IQR_MULTIPLIER = 1.5;

function iqrBounds(values: number[]): { lower: number; upper: number } | null {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length < 4) return null;
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  return { lower: q1 - IQR_MULTIPLIER * iqr, upper: q3 + IQR_MULTIPLIER * iqr };
}

export type MarkedSplit<T extends Split> = T & { isOutlier: boolean };

export function markOutliers<T extends Split>(splits: T[]): MarkedSplit<T>[] {
  // Group paces by split_type for per-type IQR computation
  const pacesByType = new Map<string, number[]>();
  for (const s of splits) {
    if (s.split_type == null || s.pace_min_km == null) continue;
    const group = pacesByType.get(s.split_type) ?? [];
    group.push(s.pace_min_km);
    pacesByType.set(s.split_type, group);
  }

  const boundsCache = new Map<string, ReturnType<typeof iqrBounds>>();
  for (const [type, paces] of pacesByType) {
    boundsCache.set(type, iqrBounds(paces));
  }

  return splits.map((s) => {
    if (s.split_type == null) return { ...s, isOutlier: false };

    // Forgotten-watch guard: long idle segments
    if (
      s.split_type === "idle" &&
      s.duration_min != null &&
      s.duration_min > IDLE_OUTLIER_DURATION_MIN
    ) {
      return { ...s, isOutlier: true };
    }

    // IQR outlier within the split's type group
    const bounds = boundsCache.get(s.split_type);
    if (bounds && s.pace_min_km != null) {
      if (s.pace_min_km < bounds.lower || s.pace_min_km > bounds.upper) {
        return { ...s, isOutlier: true };
      }
    }

    return { ...s, isOutlier: false };
  });
}

export function filterSplitsByType<T extends Split & { isOutlier: boolean }>(
  splits: T[],
  selectedTypes: Set<string>,
  hideOutliers: boolean,
): T[] {
  return splits.filter((s) => {
    // Pre-backfill splits (null type) are always kept
    if (s.split_type == null) return true;
    if (!selectedTypes.has(s.split_type)) return false;
    if (hideOutliers && s.isOutlier) return false;
    return true;
  });
}

export function computePaceFromSplits(splits: Split[]): number | null {
  let totalDuration = 0;
  let totalDistance = 0;
  for (const s of splits) {
    if (s.duration_min != null && s.distance_km != null && s.distance_km > 0) {
      totalDuration += s.duration_min;
      totalDistance += s.distance_km;
    }
  }
  return totalDistance > 0
    ? Math.round((totalDuration / totalDistance) * 100) / 100
    : null;
}

export function computeHrFromSplits(splits: Split[]): number | null {
  let weightedSum = 0;
  let totalDuration = 0;
  for (const s of splits) {
    if (s.avg_hr != null && s.duration_min != null && s.duration_min > 0) {
      weightedSum += s.avg_hr * s.duration_min;
      totalDuration += s.duration_min;
    }
  }
  return totalDuration > 0 ? Math.round(weightedSum / totalDuration) : null;
}

export function activitiesToSplitLike(
  activities: Activity[],
): SplitWithActivity[] {
  return activities.map((a) => ({
    split_number: 1,
    distance_km: a.distance_km,
    duration_min: a.duration_min,
    pace_min_km: a.avg_pace_min_km,
    avg_hr: a.avg_hr,
    elevation_gain_m: a.elevation_gain_m,
    split_type: null,
    activity_id: a.id,
    activity_name: a.name,
    activity_date: a.date,
  }));
}

export function dateToColor(
  date: string,
  minDate: string,
  maxDate: string,
): string {
  const min = new Date(minDate).getTime();
  const max = new Date(maxDate).getTime();
  const cur = new Date(date).getTime();
  const t = max === min ? 1 : (cur - min) / (max - min);
  // HSL: hue from 0 (red/old) → 130 (green/recent), full saturation
  const hue = Math.round(t * 130);
  return `hsl(${hue}, 75%, 50%)`;
}

export interface CumulativePoint {
  timestamp: number;
  date: string;
  cumKm: number;
}

export function computeCumulativeDistance(
  activities: Activity[],
): CumulativePoint[] {
  const sorted = [...activities]
    .filter((a) => a.distance_km != null)
    .sort((a, b) => a.date.localeCompare(b.date));
  let cum = 0;
  return sorted.map((a) => {
    cum += a.distance_km!;
    return {
      timestamp: new Date(a.date).getTime(),
      date: new Date(a.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      cumKm: Math.round(cum * 100) / 100,
    };
  });
}

export interface PaceBucket {
  label: string;
  avgPace: number | null;
  count: number;
}

const PACE_DISTANCE_RANGES = [
  { label: "<5 km", min: 0, max: 5 },
  { label: "5-8 km", min: 5, max: 8 },
  { label: "8-12 km", min: 8, max: 12 },
  { label: "12-16 km", min: 12, max: 16 },
  { label: "16-21 km", min: 16, max: 21 },
  { label: "21+ km", min: 21, max: Infinity },
];

export function computePaceByDistanceBucket(
  activities: Activity[],
): PaceBucket[] {
  return PACE_DISTANCE_RANGES.map((r) => {
    const matching = activities.filter(
      (a) =>
        a.distance_km != null &&
        a.duration_min != null &&
        a.distance_km >= r.min &&
        a.distance_km < r.max,
    );
    const totalDuration = matching.reduce((s, a) => s + a.duration_min!, 0);
    const totalDistance = matching.reduce((s, a) => s + a.distance_km!, 0);
    return {
      label: r.label,
      avgPace: totalDistance > 0
        ? Math.round((totalDuration / totalDistance) * 100) / 100
        : null,
      count: matching.length,
    };
  });
}

export interface WeekLongestRun {
  week: string;
  maxKm: number;
}

export function groupByWeekLongestRun(
  activities: Activity[],
): WeekLongestRun[] {
  const map = new Map<string, number>();
  for (const a of activities) {
    if (a.distance_km == null) continue;
    const key = mondayKey(toMonday(new Date(a.date)));
    map.set(key, Math.max(map.get(key) ?? 0, a.distance_km));
  }

  return getAllMondays(activities).map((mon) => {
    const key = mondayKey(mon);
    return {
      week: mondayLabel(mon),
      maxKm: Math.round((map.get(key) ?? 0) * 100) / 100,
    };
  });
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  km: number;
  weekday: number; // 0=Sun..6=Sat
  weekIndex: number;
}

export function buildCalendarData(
  activities: Activity[],
  weeks: number = 26,
): CalendarDay[] {
  // Map date -> total km
  const dayMap = new Map<string, number>();
  for (const a of activities) {
    if (a.distance_km == null) continue;
    const key = a.date.slice(0, 10);
    dayMap.set(key, (dayMap.get(key) ?? 0) + a.distance_km);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days: CalendarDay[] = [];

  // Go back N weeks from this Saturday
  const startDay = new Date(today);
  startDay.setDate(startDay.getDate() - (weeks * 7 - 1));
  // Align to Sunday
  startDay.setDate(startDay.getDate() - startDay.getDay());

  const totalDays = weeks * 7;
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDay);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      date: key,
      km: dayMap.get(key) ?? 0,
      weekday: d.getDay(),
      weekIndex: Math.floor(i / 7),
    });
  }

  return days;
}

export interface PaceImprovementPoint {
  month: string;
  pctChange: number;
}

export function computePaceImprovement(
  activities: Activity[],
): PaceImprovementPoint[] {
  const months = groupByMonth(activities).filter((m) => m.avgPace != null);
  if (months.length < 2) return [];

  return months.map((m, i) => {
    if (i === 0) return { month: m.month, pctChange: 0 };
    const prev = months[i - 1].avgPace!;
    return {
      month: m.month,
      pctChange: Math.round(((prev - m.avgPace!) / prev) * 1000) / 10,
    };
  });
}

export interface EffortPoint {
  date: string;
  effort: number;
  timestamp: number;
}

export function computeEffortScore(
  activities: Activity[],
): EffortPoint[] {
  return [...activities]
    .filter((a) => a.avg_pace_min_km != null && a.avg_hr != null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((a) => ({
      date: new Date(a.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      // Lower pace (faster) * lower HR = more efficient = lower score
      effort: Math.round(a.avg_pace_min_km! * a.avg_hr!),
      timestamp: new Date(a.date).getTime(),
    }));
}

export interface RunFrequencyPoint {
  week: string;
  runs: number;
}

export function computeRunFrequency(
  activities: Activity[],
): RunFrequencyPoint[] {
  const map = new Map<string, number>();
  for (const a of activities) {
    const key = mondayKey(toMonday(new Date(a.date)));
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return getAllMondays(activities).map((mon) => {
    const key = mondayKey(mon);
    return {
      week: mondayLabel(mon),
      runs: map.get(key) ?? 0,
    };
  });
}
