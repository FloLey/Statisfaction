import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import * as api from "./api";

vi.mock("./api");

const mockTodos: api.Todo[] = [
  { id: 1, title: "Buy milk", created_at: "2026-03-12T10:00:00Z" },
];

beforeEach(() => {
  vi.mocked(api.getTodos).mockResolvedValue(mockTodos);
  vi.mocked(api.createTodo).mockResolvedValue({
    id: 2,
    title: "New task",
    created_at: "2026-03-12T12:00:00Z",
  });
  vi.mocked(api.deleteTodo).mockResolvedValue(undefined);
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
});
