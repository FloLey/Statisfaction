import { useEffect, useState } from "react";
import { getTodos, createTodo, deleteTodo, type Todo } from "./api";
import AddTodo from "./components/AddTodo";
import TodoList from "./components/TodoList";
import "./App.css";

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTodos()
      .then(setTodos)
      .catch((err) => {
        console.error("Failed to load todos:", err);
        setError("Failed to load todos");
      });
  }, []);

  async function handleAdd(title: string) {
    setError(null);
    try {
      const todo = await createTodo(title);
      setTodos((prev) => [todo, ...prev]);
    } catch (err) {
      console.error("Failed to add todo:", err);
      setError("Failed to add todo");
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    try {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to delete todo:", err);
      setError("Failed to delete todo");
    }
  }

  return (
    <div className="app">
      <h1>Todo List</h1>
      {error && <p className="app-error">{error}</p>}
      <AddTodo onAdd={handleAdd} />
      <TodoList todos={todos} onDelete={handleDelete} />
    </div>
  );
}
