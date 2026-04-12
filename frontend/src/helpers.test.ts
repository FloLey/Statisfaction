import { describe, it, expect } from "vitest";
import {
  formatPace,
  formatDuration,
  formatDistance,
  formatDate,
} from "./helpers";

describe("formatPace", () => {
  it("formats pace as M:SS /km", () => {
    expect(formatPace(5.2)).toBe("5:12 /km");
  });

  it("returns dash for null", () => {
    expect(formatPace(null)).toBe("—");
  });
});

describe("formatDuration", () => {
  it("formats minutes under an hour", () => {
    expect(formatDuration(52.3)).toBe("52:18");
  });

  it("formats with hours", () => {
    expect(formatDuration(65.7)).toBe("1:05:42");
  });

  it("returns dash for null", () => {
    expect(formatDuration(null)).toBe("—");
  });
});

describe("formatDistance", () => {
  it("formats km with 2 decimals", () => {
    expect(formatDistance(10.05)).toBe("10.05 km");
  });

  it("returns dash for null", () => {
    expect(formatDistance(null)).toBe("—");
  });
});

describe("formatDate", () => {
  it("formats ISO date to readable string", () => {
    const result = formatDate("2026-03-15 08:00:00");
    expect(result).toContain("Mar");
    expect(result).toContain("15");
    expect(result).toContain("2026");
  });
});
