const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export interface Todo {
  id: number;
  title: string;
  created_at: string;
}

export async function getTodos(): Promise<Todo[]> {
  const res = await fetch(`${BASE_URL}/todos`);
  if (!res.ok) throw new Error(`Failed to fetch todos: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function createTodo(title: string): Promise<Todo> {
  const res = await fetch(`${BASE_URL}/todos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Failed to create todo: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function deleteTodo(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/todos/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to delete todo: ${res.status} ${res.statusText}`);
}
