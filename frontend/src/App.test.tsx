import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import * as api from "./api";

vi.mock("./api");

const mockTodos: api.Todo[] = [
  { id: 1, title: "Buy milk", created_at: "2026-03-12T10:00:00Z", completed_at: null },
];

const mockCompletedTodo: api.Todo = {
  id: 1,
  title: "Buy milk",
  created_at: "2026-03-12T10:00:00Z",
  completed_at: "2026-03-12T14:00:00Z",
};

const mockStats: api.DailyStatsResponse = {
  completed: [{ date: "2026-03-12", count: 3 }],
  created: [{ date: "2026-03-12", count: 5 }],
};

beforeEach(() => {
  vi.mocked(api.getTodos).mockResolvedValue(mockTodos);
  vi.mocked(api.createTodo).mockResolvedValue({
    id: 2,
    title: "New task",
    created_at: "2026-03-12T12:00:00Z",
    completed_at: null,
  });
  vi.mocked(api.deleteTodo).mockResolvedValue(undefined);
  vi.mocked(api.completeTodo).mockResolvedValue(mockCompletedTodo);
  vi.mocked(api.getDailyStats).mockResolvedValue(mockStats);
});

describe("App", () => {
  it("loads and displays todos on mount", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
    });
  });

  it("adds a new todo", async () => {
    render(<App />);
    await waitFor(() => screen.getByText("Buy milk"));
    await userEvent.type(screen.getByRole("textbox"), "New task");
    await userEvent.click(screen.getByRole("button", { name: /add/i }));
    await waitFor(() => {
      expect(api.createTodo).toHaveBeenCalledWith("New task");
      expect(screen.getByText("New task")).toBeInTheDocument();
    });
  });

  it("deletes a todo", async () => {
    render(<App />);
    await waitFor(() => screen.getByText("Buy milk"));
    await userEvent.click(screen.getByRole("button", { name: /delete buy milk/i }));
    await waitFor(() => {
      expect(api.deleteTodo).toHaveBeenCalledWith(1);
      expect(screen.queryByText("Buy milk")).not.toBeInTheDocument();
    });
  });

  it("opens and closes documentation modal", async () => {
    render(<App />);
    await waitFor(() => screen.getByText("Buy milk"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /open documentation/i }));
    expect(screen.getByRole("dialog", { name: /documentation/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /close documentation/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows three tabs", async () => {
    render(<App />);
    await waitFor(() => screen.getByText("Buy milk"));
    expect(screen.getByRole("tab", { name: /to do/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /done/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /stats/i })).toBeInTheDocument();
  });

  it("switches to Done tab", async () => {
    render(<App />);
    await waitFor(() => screen.getByText("Buy milk"));
    await userEvent.click(screen.getByRole("tab", { name: /^done/i }));
    expect(screen.getByText("No completed tasks yet.")).toBeInTheDocument();
  });

  it("completes a todo and moves it to Done tab", async () => {
    render(<App />);
    await waitFor(() => screen.getByText("Buy milk"));
    await userEvent.click(screen.getByRole("button", { name: /complete buy milk/i }));
    await waitFor(() => {
      expect(api.completeTodo).toHaveBeenCalledWith(1);
    });
  });

  it("switches to Stats tab and shows charts", async () => {
    render(<App />);
    await waitFor(() => screen.getByText("Buy milk"));
    await userEvent.click(screen.getByRole("tab", { name: /stats/i }));
    await waitFor(() => {
      expect(screen.getByText("Tasks Created")).toBeInTheDocument();
      expect(screen.getByText("Tasks Completed")).toBeInTheDocument();
    });
  });
});
