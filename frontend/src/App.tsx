import { useState, useEffect, useCallback } from "react";
import { getTodos, createTodo, deleteTodo, Todo } from "./api";
import AddTodo from "./components/AddTodo";
import TodoList from "./components/TodoList";
import DocsModal from "./components/DocsModal";
import "./App.css";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [docsOpen, setDocsOpen] = useState(false);

  const fetchTodos = useCallback(async () => {
    try {
      setTodos(await getTodos());
    } catch {
      setError("Failed to load todos.");
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleAdd = async (title: string) => {
    try {
      const todo = await createTodo(title);
      setTodos((prev) => [todo, ...prev]);
      setError(null);
    } catch {
      setError("Failed to create todo.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Failed to delete todo.");
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Statisfaction</h1>
        <p>Keep track of what needs doing</p>
        <button
          className="btn-docs"
          onClick={() => setDocsOpen(true)}
          aria-label="Open documentation"
        >
          Docs
        </button>
      </header>

      <DocsModal open={docsOpen} onClose={() => setDocsOpen(false)} />

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      <div className="card">
        <AddTodo onAdd={handleAdd} />
        <TodoList todos={todos} onDelete={handleDelete} />
      </div>

      <footer className="app-footer">
        {todos.length > 0 && `${todos.length} item${todos.length !== 1 ? "s" : ""}`}
      </footer>
    </div>
  );
}
