import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TodoList from "../components/TodoList";
import type { Todo } from "../api";

const mockTodos: Todo[] = [
  { id: 1, title: "First todo", created_at: "2026-01-01T00:00:00" },
  { id: 2, title: "Second todo", created_at: "2026-01-01T00:01:00" },
];

describe("TodoList", () => {
  it("renders empty state when no todos", () => {
    render(<TodoList todos={[]} onDelete={vi.fn()} />);
    expect(screen.getByText("No todos yet.")).toBeInTheDocument();
  });

  it("renders all todos", () => {
    render(<TodoList todos={mockTodos} onDelete={vi.fn()} />);
    expect(screen.getByText("First todo")).toBeInTheDocument();
    expect(screen.getByText("Second todo")).toBeInTheDocument();
  });

  it("calls onDelete with correct id", async () => {
    const onDelete = vi.fn();
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    render(<TodoList todos={mockTodos} onDelete={onDelete} />);

    await user.click(screen.getByLabelText("Delete First todo"));
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
