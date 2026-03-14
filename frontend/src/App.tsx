import { useState, useEffect, useCallback } from "react";
import { getTodos, createTodo, deleteTodo, Todo } from "./api";
import AddTodo from "./components/AddTodo";
import TodoList from "./components/TodoList";
import IdeasSection from "./components/IdeasSection";
import "./App.css";

type View = "home" | "ideas";

function Nav({ view, onNav }: { view: View; onNav: (v: View) => void }) {
  return (
    <nav className="app-nav">
      <button className="nav-brand" onClick={() => onNav("home")}>
        Statisfaction
      </button>
      <div className="nav-links">
        <button
          className={`nav-link ${view === "home" ? "nav-link--active" : ""}`}
          onClick={() => onNav("home")}
        >
          Accueil
        </button>
        <button
          className={`nav-link ${view === "ideas" ? "nav-link--active" : ""}`}
          onClick={() => onNav("ideas")}
        >
          Idées
        </button>
      </div>
    </nav>
  );
}

export default function App() {
  const [view, setView] = useState<View>("home");
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
    if (view === "home") fetchTodos();
  }, [fetchTodos, view]);

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

  function handleNav(v: View) {
    setView(v);
    window.scrollTo(0, 0);
  }

  if (view === "ideas") {
    return (
      <div className="app app--ideas">
        <Nav view={view} onNav={handleNav} />
        <IdeasSection />
      </div>
    );
  }

  return (
    <div className="app">
      <Nav view={view} onNav={handleNav} />

      <header className="app-header">
        <p>Keep track of what needs doing</p>
      </header>

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
