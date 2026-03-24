const BASE_URL = import.meta.env.VITE_API_URL ?? "http://100.109.197.38:8001";

export interface Todo {
  id: number;
  title: string;
  created_at: string;
  completed_at: string | null;
}

export interface DailyStat {
  date: string;
  count: number;
}

export interface DailyStatsResponse {
  completed: DailyStat[];
  created: DailyStat[];
}

export async function getTodos(): Promise<Todo[]> {
  const res = await fetch(`${BASE_URL}/api/todos`);
  if (!res.ok) throw new Error("Failed to fetch todos");
  return res.json();
}

export async function createTodo(title: string): Promise<Todo> {
  const res = await fetch(`${BASE_URL}/api/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create todo");
  return res.json();
}

export async function deleteTodo(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/todos/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete todo");
}

export async function completeTodo(id: number): Promise<Todo> {
  const res = await fetch(`${BASE_URL}/api/todos/${id}/complete`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Failed to update todo");
  return res.json();
}

export async function getDailyStats(): Promise<DailyStatsResponse> {
  const res = await fetch(`${BASE_URL}/api/todos/stats/daily`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}
