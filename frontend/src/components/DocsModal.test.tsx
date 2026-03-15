import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DocsModal from "./DocsModal";

describe("DocsModal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(<DocsModal open={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders documentation when open", () => {
    render(<DocsModal open={true} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: /documentation/i })).toBeInTheDocument();
    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(screen.getByText("API Reference")).toBeInTheDocument();
    expect(screen.getByText("Tech Stack")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    render(<DocsModal open={true} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /close documentation/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when overlay is clicked", async () => {
    const onClose = vi.fn();
    render(<DocsModal open={true} onClose={onClose} />);
    await userEvent.click(screen.getByText("Documentation").closest(".docs-overlay")!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = vi.fn();
    render(<DocsModal open={true} onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });
});
