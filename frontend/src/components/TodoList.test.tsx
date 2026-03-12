import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TodoList from "./TodoList";
import { Todo } from "../api";

const mockTodos: Todo[] = [
  { id: 1, title: "Buy milk", created_at: "2026-03-12T10:00:00Z" },
  { id: 2, title: "Walk the dog", created_at: "2026-03-12T11:00:00Z" },
];

describe("TodoList", () => {
  it("renders empty state when no todos", () => {
    render(<TodoList todos={[]} onDelete={vi.fn()} />);
    expect(screen.getByText(/no todos yet/i)).toBeInTheDocument();
  });

  it("renders all todo titles", () => {
    render(<TodoList todos={mockTodos} onDelete={vi.fn()} />);
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
    expect(screen.getByText("Walk the dog")).toBeInTheDocument();
  });

  it("calls onDelete with correct id when delete button clicked", async () => {
    const onDelete = vi.fn();
    render(<TodoList todos={mockTodos} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: /delete buy milk/i }));
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
