import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CompletionChart from "./CompletionChart";
import { DailyStat } from "../api";

const completedStats: DailyStat[] = [
  { date: "2026-03-10", count: 2 },
  { date: "2026-03-11", count: 5 },
];

const createdStats: DailyStat[] = [
  { date: "2026-03-10", count: 3 },
  { date: "2026-03-11", count: 1 },
];

describe("CompletionChart", () => {
  it("renders empty state when no data", () => {
    render(<CompletionChart completedStats={[]} createdStats={[]} />);
    expect(screen.getByText(/no stats yet/i)).toBeInTheDocument();
  });

  it("renders completed chart when data exists", () => {
    render(<CompletionChart completedStats={completedStats} createdStats={[]} />);
    expect(screen.getByText("Tasks Completed")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders created chart when data exists", () => {
    render(<CompletionChart completedStats={[]} createdStats={createdStats} />);
    expect(screen.getByText("Tasks Created")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders both charts", () => {
    render(<CompletionChart completedStats={completedStats} createdStats={createdStats} />);
    expect(screen.getByText("Tasks Completed")).toBeInTheDocument();
    expect(screen.getByText("Tasks Created")).toBeInTheDocument();
  });

  it("formats dates as MM/DD", () => {
    render(<CompletionChart completedStats={completedStats} createdStats={[]} />);
    expect(screen.getByText("03/10")).toBeInTheDocument();
    expect(screen.getByText("03/11")).toBeInTheDocument();
  });
});
