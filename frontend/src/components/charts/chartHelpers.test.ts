import { describe, it, expect } from "vitest";
import {
  paceTickFormatter,
  computeMovingAverage,
  groupByWeek,
  groupByMonth,
  bucketDistances,
  markOutliers,
  filterSplitsByType,
  filterNonRunningActivities,
  computePaceFromSplits,
  computeHrFromSplits,
} from "./chartHelpers";
import { Activity, Split, SplitWithActivity } from "../../api";

function makeSplit(overrides: Partial<Split> & { split_number: number }): Split {
  return {
    distance_km: 1.0,
    duration_min: 5.0,
    pace_min_km: 5.0,
    avg_hr: 150,
    elevation_gain_m: 5,
    split_type: "running",
    ...overrides,
  };
}

function makeActivity(
  overrides: Partial<Activity> & { date: string },
): Activity {
  return {
    id: 1,
    user_id: 1,
    garmin_id: "1",
    name: "Run",
    distance_km: 10,
    duration_min: 50,
    avg_hr: 150,
    max_hr: 170,
    avg_pace_min_km: 5.0,
    elevation_gain_m: 30,
    run_type: null,
    ...overrides,
  };
}

describe("paceTickFormatter", () => {
  it("formats pace as M:SS", () => {
    expect(paceTickFormatter(5.2)).toBe("5:12");
    expect(paceTickFormatter(4.0)).toBe("4:00");
    expect(paceTickFormatter(6.75)).toBe("6:45");
  });
});

describe("computeMovingAverage", () => {
  it("computes SMA", () => {
    const result = computeMovingAverage([4, 6, 8, 10], 2);
    expect(result).toEqual([4, 5, 7, 9]);
  });

  it("handles nulls", () => {
    const result = computeMovingAverage([4, null, 8], 2);
    expect(result[0]).toBe(4);
    expect(result[1]).toBe(4);
    expect(result[2]).toBe(8);
  });

  it("computes duration-weighted moving average", () => {
    // window=2: result[0]=4 (only one point), result[1]=(4*1+8*3)/(1+3)=7
    const result = computeMovingAverage([4, 8], 2, [1, 3]);
    expect(result[0]).toBe(4);
    expect(result[1]).toBe(7);
  });
});

describe("groupByWeek", () => {
  it("groups activities by ISO week", () => {
    const activities = [
      makeActivity({ date: "2026-03-16 08:00:00", distance_km: 10 }),
      makeActivity({ date: "2026-03-18 08:00:00", distance_km: 5 }),
      makeActivity({ date: "2026-03-23 08:00:00", distance_km: 8 }),
    ];
    const weeks = groupByWeek(activities);
    expect(weeks.length).toBe(2);
    expect(weeks[0].totalKm).toBe(15);
    expect(weeks[1].totalKm).toBe(8);
  });
});

describe("groupByMonth", () => {
  it("groups activities by month with duration-weighted pace", () => {
    const activities = [
      makeActivity({
        date: "2026-03-15 08:00:00",
        distance_km: 10,
        duration_min: 50,   // 50/10 = 5.0 min/km
        avg_pace_min_km: 5.0,
      }),
      makeActivity({
        date: "2026-03-20 08:00:00",
        distance_km: 8,
        duration_min: 44,   // 44/8 = 5.5 min/km
        avg_pace_min_km: 5.5,
      }),
      makeActivity({
        date: "2026-04-01 08:00:00",
        distance_km: 12,
        duration_min: 57.6, // 57.6/12 = 4.8 min/km
        avg_pace_min_km: 4.8,
      }),
    ];
    const months = groupByMonth(activities);
    expect(months.length).toBe(2);
    expect(months[0].totalKm).toBe(18);
    // Weighted: (50+44)/(10+8) = 94/18 ≈ 5.22
    expect(months[0].avgPace).toBe(5.22);
  });
});

describe("markOutliers", () => {
  it("marks long idle splits as outliers", () => {
    const splits = [
      makeSplit({ split_number: 1, split_type: "idle", duration_min: 1, pace_min_km: 25 }),
      makeSplit({ split_number: 2, split_type: "idle", duration_min: 10, pace_min_km: 25 }),
    ];
    const marked = markOutliers(splits);
    expect(marked[0].isOutlier).toBe(false); // 1 min idle — short break
    expect(marked[1].isOutlier).toBe(true);  // 10 min idle — forgotten watch
  });

  it("marks IQR outliers using combined non-idle pace distribution", () => {
    // Mix of fast/running/walking — IQR computed across all together (multiplier=1.5)
    // paces sorted: [3.5, 5.0, 5.1, 5.2, 8.0] → Q1=3.5, Q3=8.0, IQR=4.5
    // fence: lower=3.5-6.75=-3.25, upper=8.0+6.75=14.75 → 30.0 is outside
    const splits = [
      makeSplit({ split_number: 1, split_type: "fast", pace_min_km: 3.5 }),
      makeSplit({ split_number: 2, split_type: "running", pace_min_km: 5.0 }),
      makeSplit({ split_number: 3, split_type: "running", pace_min_km: 5.1 }),
      makeSplit({ split_number: 4, split_type: "running", pace_min_km: 5.2 }),
      makeSplit({ split_number: 5, split_type: "walking", pace_min_km: 8.0 }),
      makeSplit({ split_number: 6, split_type: "running", pace_min_km: 30.0 }), // outlier
    ];
    const marked = markOutliers(splits, 1.5);
    expect(marked[5].isOutlier).toBe(true);
    expect(marked[0].isOutlier).toBe(false); // fast split not flagged despite being fast
    expect(marked[4].isOutlier).toBe(false); // walking split not flagged despite being slow
  });

  it("flags fewer outliers with a higher IQR multiplier", () => {
    // paces: [5.0, 5.1, 5.2, 5.3, 9.0] → Q1=5.0, Q3=9.0, IQR=4.0
    // multiplier=1.5: upper=9.0+6.0=15.0 → 16.0 is outlier
    // multiplier=3.0: upper=9.0+12.0=21.0 → 16.0 is NOT outlier
    const splits = [
      makeSplit({ split_number: 1, pace_min_km: 5.0 }),
      makeSplit({ split_number: 2, pace_min_km: 5.1 }),
      makeSplit({ split_number: 3, pace_min_km: 5.2 }),
      makeSplit({ split_number: 4, pace_min_km: 9.0 }),
      makeSplit({ split_number: 5, pace_min_km: 16.0 }),
    ];
    expect(markOutliers(splits, 1.5)[4].isOutlier).toBe(true);
    expect(markOutliers(splits, 3.0)[4].isOutlier).toBe(false);
  });

  it("does not mark null split_type splits as outliers", () => {
    const splits = [makeSplit({ split_number: 1, split_type: null })];
    const marked = markOutliers(splits);
    expect(marked[0].isOutlier).toBe(false);
  });
});

describe("filterSplitsByType", () => {
  it("keeps only selected types", () => {
    const splits = [
      { ...makeSplit({ split_number: 1, split_type: "running" }), isOutlier: false },
      { ...makeSplit({ split_number: 2, split_type: "walking" }), isOutlier: false },
      { ...makeSplit({ split_number: 3, split_type: "idle" }), isOutlier: false },
    ];
    const result = filterSplitsByType(splits, new Set(["running"]), false);
    expect(result.length).toBe(1);
    expect(result[0].split_type).toBe("running");
  });

  it("excludes outliers when showOutliers is false", () => {
    const splits = [
      { ...makeSplit({ split_number: 1, split_type: "running" }), isOutlier: false },
      { ...makeSplit({ split_number: 2, split_type: "running" }), isOutlier: true },
    ];
    const result = filterSplitsByType(splits, new Set(["running"]), false);
    expect(result.length).toBe(1);
    expect(result[0].isOutlier).toBe(false);
  });

  it("includes outliers when showOutliers is true, regardless of type filter", () => {
    const splits = [
      { ...makeSplit({ split_number: 1, split_type: "running" }), isOutlier: false },
      { ...makeSplit({ split_number: 2, split_type: "walking" }), isOutlier: true },
    ];
    // Only "running" selected, but showOutliers=true → running non-outlier + walking outlier
    const result = filterSplitsByType(splits, new Set(["running"]), true);
    expect(result.length).toBe(2);
  });

  it("always keeps null split_type splits", () => {
    const splits = [
      { ...makeSplit({ split_number: 1, split_type: null }), isOutlier: false },
    ];
    const result = filterSplitsByType(splits, new Set(["running"]), false);
    expect(result.length).toBe(1);
  });
});

describe("computePaceFromSplits", () => {
  it("computes distance-weighted pace", () => {
    const splits = [
      makeSplit({ split_number: 1, distance_km: 1.0, duration_min: 5.0 }),  // 5 min/km
      makeSplit({ split_number: 2, distance_km: 2.0, duration_min: 8.0 }),  // 4 min/km
    ];
    // (5+8)/(1+2) = 13/3 ≈ 4.33
    expect(computePaceFromSplits(splits)).toBe(4.33);
  });

  it("returns null for empty input", () => {
    expect(computePaceFromSplits([])).toBeNull();
  });
});

describe("computeHrFromSplits", () => {
  it("computes duration-weighted HR", () => {
    const splits = [
      makeSplit({ split_number: 1, avg_hr: 140, duration_min: 5 }),
      makeSplit({ split_number: 2, avg_hr: 160, duration_min: 15 }),
    ];
    // (140*5 + 160*15) / (5+15) = (700+2400)/20 = 155
    expect(computeHrFromSplits(splits)).toBe(155);
  });

  it("returns null for empty input", () => {
    expect(computeHrFromSplits([])).toBeNull();
  });
});

function makeSplitWithActivity(
  overrides: Partial<SplitWithActivity> & { split_number: number; activity_id: number },
): SplitWithActivity {
  return {
    activity_name: "Test run",
    activity_date: "2026-01-01",
    distance_km: 1.0,
    duration_min: 5.0,
    pace_min_km: 5.0,
    avg_hr: 150,
    elevation_gain_m: 5,
    split_type: "running",
    ...overrides,
  };
}

describe("filterNonRunningActivities", () => {
  it("keeps activities that have at least one running or fast split", () => {
    const splits = [
      makeSplitWithActivity({ split_number: 1, activity_id: 1, split_type: "running" }),
      makeSplitWithActivity({ split_number: 2, activity_id: 1, split_type: "idle" }),
    ];
    expect(filterNonRunningActivities(splits)).toHaveLength(2);
  });

  it("removes activities with only idle/walk splits", () => {
    const splits = [
      makeSplitWithActivity({ split_number: 1, activity_id: 2, split_type: "walking" }),
      makeSplitWithActivity({ split_number: 2, activity_id: 2, split_type: "idle" }),
    ];
    expect(filterNonRunningActivities(splits)).toHaveLength(0);
  });

  it("keeps running activities and removes walk-only ones", () => {
    const splits = [
      makeSplitWithActivity({ split_number: 1, activity_id: 1, split_type: "running" }),
      makeSplitWithActivity({ split_number: 2, activity_id: 1, split_type: "walking" }),
      makeSplitWithActivity({ split_number: 1, activity_id: 2, split_type: "walking" }),
      makeSplitWithActivity({ split_number: 2, activity_id: 2, split_type: "idle" }),
    ];
    const result = filterNonRunningActivities(splits);
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.activity_id === 1)).toBe(true);
  });
});

describe("bucketDistances", () => {
  it("buckets activities by distance", () => {
    const activities = [
      makeActivity({ date: "2026-03-15", distance_km: 2 }),
      makeActivity({ date: "2026-03-16", distance_km: 5 }),
      makeActivity({ date: "2026-03-17", distance_km: 10 }),
      makeActivity({ date: "2026-03-18", distance_km: 25 }),
    ];
    const buckets = bucketDistances(activities);
    expect(buckets.find((b) => b.label === "0-3 km")?.count).toBe(1);
    expect(buckets.find((b) => b.label === "5-8 km")?.count).toBe(1);
    expect(buckets.find((b) => b.label === "8-12 km")?.count).toBe(1);
    expect(buckets.find((b) => b.label === "21+ km")?.count).toBe(1);
  });
});
