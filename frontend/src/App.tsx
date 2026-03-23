import { useState, useEffect, useCallback } from "react";
import {
  getTodos,
  createTodo,
  deleteTodo,
  completeTodo,
  getDailyStats,
  Todo,
  DailyStat,
  DailyStatsResponse,
} from "./api";
import AddTodo from "./components/AddTodo";
import TodoList from "./components/TodoList";
import TabNav, { Tab } from "./components/TabNav";
import CompletionChart from "./components/CompletionChart";
import DocsModal from "./components/DocsModal";
import "./App.css";

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function adjustStat(stats: DailyStat[], dateKey: string, delta: number): DailyStat[] {
  const updated = stats.map((s) =>
    s.date === dateKey ? { ...s, count: s.count + delta } : s,
  );
  const exists = updated.some((s) => s.date === dateKey);
  if (!exists && delta > 0) {
    updated.push({ date: dateKey, count: delta });
    updated.sort((a, b) => a.date.localeCompare(b.date));
  }
  return updated.filter((s) => s.count > 0);
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<DailyStatsResponse>({ completed: [], created: [] });
  const [error, setError] = useState<string | null>(null);
  const [docsOpen, setDocsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("todo");

  const fetchTodos = useCallback(async () => {
    try {
      setTodos(await getTodos());
    } catch {
      setError("Failed to load todos.");
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setStats(await getDailyStats());
    } catch {
      setError("Failed to load stats.");
    }
  }, []);

  useEffect(() => {
    fetchTodos();
    fetchStats();
  }, [fetchTodos, fetchStats]);

  const handleAdd = async (title: string) => {
    try {
      const todo = await createTodo(title);
      setTodos((prev) => [todo, ...prev]);
      setStats((prev) => ({
        ...prev,
        created: adjustStat(prev.created, toDateKey(todo.created_at), 1),
      }));
      setError(null);
    } catch {
      setError("Failed to create todo.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const todo = todos.find((t) => t.id === id);
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
      if (todo) {
        setStats((prev) => {
          let next = {
            ...prev,
            created: adjustStat(prev.created, toDateKey(todo.created_at), -1),
          };
          if (todo.completed_at) {
            next = {
              ...next,
              completed: adjustStat(prev.completed, toDateKey(todo.completed_at), -1),
            };
          }
          return next;
        });
      }
    } catch {
      setError("Failed to delete todo.");
    }
  };

  const handleComplete = async (id: number) => {
    try {
      const old = todos.find((t) => t.id === id);
      const updated = await completeTodo(id);
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setStats((prev) => {
        if (updated.completed_at) {
          // Was uncompleted -> now completed
          return {
            ...prev,
            completed: adjustStat(prev.completed, toDateKey(updated.completed_at), 1),
          };
        } else if (old?.completed_at) {
          // Was completed -> now uncompleted
          return {
            ...prev,
            completed: adjustStat(prev.completed, toDateKey(old.completed_at), -1),
          };
        }
        return prev;
      });
      setError(null);
    } catch {
      setError("Failed to update todo.");
    }
  };

  const activeTodos = todos.filter((t) => t.completed_at === null);
  const doneTodos = todos.filter((t) => t.completed_at !== null);

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
        <TabNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          todoCount={activeTodos.length}
          doneCount={doneTodos.length}
        />

        {activeTab === "todo" && (
          <>
            <AddTodo onAdd={handleAdd} />
            <TodoList
              todos={activeTodos}
              onDelete={handleDelete}
              onComplete={handleComplete}
              showCompleteAction={true}
              emptyMessage="No todos yet. Add one above!"
            />
          </>
        )}

        {activeTab === "done" && (
          <TodoList
            todos={doneTodos}
            onDelete={handleDelete}
            onComplete={handleComplete}
            showCompleteAction={false}
            emptyMessage="No completed tasks yet."
          />
        )}

        {activeTab === "stats" && (
          <CompletionChart
            completedStats={stats.completed}
            createdStats={stats.created}
          />
        )}
      </div>

      <footer className="app-footer">
        {activeTab === "todo" && activeTodos.length > 0 &&
          `${activeTodos.length} item${activeTodos.length !== 1 ? "s" : ""}`}
        {activeTab === "done" && doneTodos.length > 0 &&
          `${doneTodos.length} completed`}
      </footer>
    </div>
  );
}
