import { useState } from "react";

interface Props {
  onAdd: (title: string) => void;
}

export default function AddTodo({ onAdd }: Props) {
  const [title, setTitle] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle("");
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New todo..."
        aria-label="New todo"
        style={{ flex: 1, padding: "0.5rem" }}
      />
      <button type="submit">Add</button>
    </form>
  );
}
