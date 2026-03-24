import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TodoList from "./TodoList";
import { Todo } from "../api";

const mockTodos: Todo[] = [
  { id: 1, title: "Buy milk", created_at: "2026-03-12T10:00:00Z", completed_at: null },
  { id: 2, title: "Walk the dog", created_at: "2026-03-12T11:00:00Z", completed_at: null },
];

const mockDoneTodos: Todo[] = [
  { id: 3, title: "Done task", created_at: "2026-03-12T10:00:00Z", completed_at: "2026-03-12T14:00:00Z" },
];

describe("TodoList", () => {
  it("renders empty state when no todos", () => {
    render(
      <TodoList todos={[]} onDelete={vi.fn()} onComplete={vi.fn()} showCompleteAction={true} />
    );
    expect(screen.getByText(/no todos yet/i)).toBeInTheDocument();
  });

  it("renders custom empty message for done tab", () => {
    render(
      <TodoList
        todos={[]}
        onDelete={vi.fn()}
        onComplete={vi.fn()}
        showCompleteAction={false}
        emptyMessage="No completed tasks yet."
      />
    );
    expect(screen.getByText("No completed tasks yet.")).toBeInTheDocument();
  });

  it("renders all todo titles", () => {
    render(
      <TodoList todos={mockTodos} onDelete={vi.fn()} onComplete={vi.fn()} showCompleteAction={true} />
    );
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
    expect(screen.getByText("Walk the dog")).toBeInTheDocument();
  });

  it("calls onDelete with correct id when delete button clicked", async () => {
    const onDelete = vi.fn();
    render(
      <TodoList todos={mockTodos} onDelete={onDelete} onComplete={vi.fn()} showCompleteAction={true} />
    );
    await userEvent.click(screen.getByRole("button", { name: /delete buy milk/i }));
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("shows Done button for active todos", () => {
    render(
      <TodoList todos={mockTodos} onDelete={vi.fn()} onComplete={vi.fn()} showCompleteAction={true} />
    );
    expect(screen.getByRole("button", { name: /complete buy milk/i })).toBeInTheDocument();
  });

  it("calls onComplete when Done button clicked", async () => {
    const onComplete = vi.fn();
    render(
      <TodoList todos={mockTodos} onDelete={vi.fn()} onComplete={onComplete} showCompleteAction={true} />
    );
    await userEvent.click(screen.getByRole("button", { name: /complete buy milk/i }));
    expect(onComplete).toHaveBeenCalledWith(1);
  });

  it("shows Undo button for completed todos", () => {
    render(
      <TodoList todos={mockDoneTodos} onDelete={vi.fn()} onComplete={vi.fn()} showCompleteAction={false} />
    );
    expect(screen.getByRole("button", { name: /undo done task/i })).toBeInTheDocument();
  });

  it("applies strikethrough class to completed todos", () => {
    render(
      <TodoList todos={mockDoneTodos} onDelete={vi.fn()} onComplete={vi.fn()} showCompleteAction={false} />
    );
    expect(screen.getByText("Done task")).toHaveClass("todo-title--done");
  });
});
