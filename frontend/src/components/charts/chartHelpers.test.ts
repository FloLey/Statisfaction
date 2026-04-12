import { describe, it, expect } from "vitest";
import {
  paceTickFormatter,
  computeMovingAverage,
  groupByWeek,
  groupByMonth,
  bucketDistances,
} from "./chartHelpers";
import { Activity } from "../../api";

function makeActivity(
  overrides: Partial<Activity> & { date: string },
): Activity {
  return {
    id: 1,
    garmin_id: "1",
    name: "Run",
    distance_km: 10,
    duration_min: 50,
    avg_hr: 150,
    max_hr: 170,
    avg_pace_min_km: 5.0,
    elevation_gain_m: 30,
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
  it("groups activities by month", () => {
    const activities = [
      makeActivity({
        date: "2026-03-15 08:00:00",
        distance_km: 10,
        avg_pace_min_km: 5.0,
      }),
      makeActivity({
        date: "2026-03-20 08:00:00",
        distance_km: 8,
        avg_pace_min_km: 5.5,
      }),
      makeActivity({
        date: "2026-04-01 08:00:00",
        distance_km: 12,
        avg_pace_min_km: 4.8,
      }),
    ];
    const months = groupByMonth(activities);
    expect(months.length).toBe(2);
    expect(months[0].totalKm).toBe(18);
    expect(months[0].avgPace).toBe(5.25);
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
