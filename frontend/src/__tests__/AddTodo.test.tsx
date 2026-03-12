import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import AddTodo from "../components/AddTodo";

describe("AddTodo", () => {
  it("renders input and button", () => {
    render(<AddTodo onAdd={vi.fn()} />);
    expect(screen.getByLabelText("New todo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("calls onAdd with trimmed title and clears input", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddTodo onAdd={onAdd} />);

    await user.type(screen.getByLabelText("New todo"), "  Buy milk  ");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onAdd).toHaveBeenCalledWith("Buy milk");
    expect(screen.getByLabelText("New todo")).toHaveValue("");
  });

  it("does not call onAdd for blank input", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddTodo onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(onAdd).not.toHaveBeenCalled();
  });
});
