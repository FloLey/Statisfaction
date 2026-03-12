import { useEffect, useState } from "react";
import { getTodos, createTodo, deleteTodo, type Todo } from "./api";
import AddTodo from "./components/AddTodo";
import TodoList from "./components/TodoList";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTodos()
      .then(setTodos)
      .catch(() => setError("Failed to load todos"));
  }, []);

  async function handleAdd(title: string) {
    try {
      const todo = await createTodo(title);
      setTodos((prev) => [todo, ...prev]);
    } catch {
      setError("Failed to add todo");
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Failed to delete todo");
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Todo List</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <AddTodo onAdd={handleAdd} />
      <TodoList todos={todos} onDelete={handleDelete} />
    </div>
  );
}
