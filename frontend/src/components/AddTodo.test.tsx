import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddTodo from "./AddTodo";

describe("AddTodo", () => {
  it("renders input and button", () => {
    render(<AddTodo onAdd={vi.fn()} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
  });

  it("calls onAdd with trimmed title and clears input", async () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "  Buy milk  ");
    await userEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(onAdd).toHaveBeenCalledWith("Buy milk");
    expect(input).toHaveValue("");
  });

  it("does not call onAdd when input is empty", async () => {
    const onAdd = vi.fn();
    render(<AddTodo onAdd={onAdd} />);
    await userEvent.click(screen.getByRole("button", { name: /add/i }));
    expect(onAdd).not.toHaveBeenCalled();
  });
});
