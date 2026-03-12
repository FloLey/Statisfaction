import { useState, useEffect, useCallback } from "react";
import { getTodos, createTodo, deleteTodo, Todo } from "./api";
import AddTodo from "./components/AddTodo";
import TodoList from "./components/TodoList";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);

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
    <main style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "sans-serif", padding: "0 1rem" }}>
      <h1>Todo List</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <AddTodo onAdd={handleAdd} />
      <TodoList todos={todos} onDelete={handleDelete} />
    </main>
  );
}
