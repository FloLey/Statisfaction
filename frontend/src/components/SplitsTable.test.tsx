import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SplitsTable from "./SplitsTable";
import { Split } from "../api";

const splits: Split[] = [
  {
    split_number: 1,
    distance_km: 1.0,
    duration_min: 5.2,
    pace_min_km: 5.2,
    avg_hr: 150,
    elevation_gain_m: 5,
    split_type: "running",
  },
  {
    split_number: 2,
    distance_km: 1.0,
    duration_min: 4.8,
    pace_min_km: 4.8,
    avg_hr: 158,
    elevation_gain_m: 3,
    split_type: "fast",
  },
];

describe("SplitsTable", () => {
  it("renders all splits", () => {
    render(<SplitsTable splits={splits} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("highlights the fastest split", () => {
    const { container } = render(<SplitsTable splits={splits} />);
    const rows = container.querySelectorAll("tbody tr");
    // Split 2 (index 1) is fastest (pace 4.8)
    expect(rows[1].className).toContain("bg-green-50");
    expect(rows[0].className).not.toContain("bg-green-50");
  });

  it("shows dash for null values", () => {
    const nullSplit: Split[] = [
      {
        split_number: 1,
        distance_km: null,
        duration_min: null,
        pace_min_km: null,
        avg_hr: null,
        elevation_gain_m: null,
        split_type: null,
      },
    ];
    render(<SplitsTable splits={nullSplit} />);
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThan(0);
  });

  it("shows split type badges", () => {
    render(<SplitsTable splits={splits} />);
    expect(screen.getByText("running")).toBeInTheDocument();
    expect(screen.getByText("fast")).toBeInTheDocument();
  });
});
