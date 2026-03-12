import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import App from "../App";
import * as api from "../api";

vi.mock("../api");

const mockTodos: api.Todo[] = [
  { id: 1, title: "Buy milk", created_at: "2026-01-01T00:00:00" },
  { id: 2, title: "Walk the dog", created_at: "2026-01-01T00:01:00" },
];

describe("App", () => {
  beforeEach(() => {
    vi.mocked(api.getTodos).mockResolvedValue(mockTodos);
    vi.mocked(api.createTodo).mockResolvedValue({
      id: 3,
      title: "New todo",
      created_at: "2026-01-01T00:02:00",
    });
    vi.mocked(api.deleteTodo).mockResolvedValue();
  });

  it("renders the todo list on load", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Buy milk")).toBeInTheDocument();
      expect(screen.getByText("Walk the dog")).toBeInTheDocument();
    });
  });

  it("adds a new todo", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => screen.getByText("Buy milk"));

    await user.type(screen.getByLabelText("New todo"), "New todo");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(api.createTodo).toHaveBeenCalledWith("New todo");
    });
  });

  it("deletes a todo", async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => screen.getByText("Buy milk"));

    await user.click(screen.getByLabelText("Delete Buy milk"));

    await waitFor(() => {
      expect(api.deleteTodo).toHaveBeenCalledWith(1);
    });
  });
});
