import { useState } from "react";

interface Props {
  onAdd: (title: string) => void;
}

export default function AddTodo({ onAdd }: Props) {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle("");
  };

  return (
    <form onSubmit={handleSubmit} className="add-todo-form">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a new todo..."
        aria-label="New todo title"
        className="add-todo-input"
      />
      <button type="submit" className="btn-add">
        Add
      </button>
    </form>
  );
}
