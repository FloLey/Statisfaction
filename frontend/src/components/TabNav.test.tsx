import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TabNav from "./TabNav";

describe("TabNav", () => {
  it("renders three tabs", () => {
    render(
      <TabNav activeTab="todo" onTabChange={vi.fn()} todoCount={0} doneCount={0} />
    );
    expect(screen.getByRole("tab", { name: /to do/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /done/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /stats/i })).toBeInTheDocument();
  });

  it("highlights the active tab", () => {
    render(
      <TabNav activeTab="done" onTabChange={vi.fn()} todoCount={0} doneCount={0} />
    );
    const doneTab = screen.getByRole("tab", { name: /done/i });
    expect(doneTab).toHaveAttribute("aria-selected", "true");
    expect(doneTab).toHaveClass("tab-btn--active");
  });

  it("calls onTabChange when a tab is clicked", async () => {
    const onTabChange = vi.fn();
    render(
      <TabNav activeTab="todo" onTabChange={onTabChange} todoCount={0} doneCount={0} />
    );
    await userEvent.click(screen.getByRole("tab", { name: /stats/i }));
    expect(onTabChange).toHaveBeenCalledWith("stats");
  });

  it("shows count badges when counts are positive", () => {
    render(
      <TabNav activeTab="todo" onTabChange={vi.fn()} todoCount={5} doneCount={3} />
    );
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("does not show badges when counts are zero", () => {
    render(
      <TabNav activeTab="todo" onTabChange={vi.fn()} todoCount={0} doneCount={0} />
    );
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
