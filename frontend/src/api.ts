const BASE_URL = import.meta.env.VITE_API_URL ?? "http://100.109.197.38:8001";

export interface Todo {
  id: number;
  title: string;
  created_at: string;
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

export interface IdeaWidget {
  id: number;
  title: string | null;
  description: string | null;
  widget_type: string;
  content: string | null;
  mime_type: string | null;
  metadata_json: Record<string, unknown> | null;
  display_order: number;
}

export interface IdeaSection {
  id: number;
  section_number: string | null;
  title: string;
  voice: string | null;
  content: string;
  display_order: number;
  widgets: IdeaWidget[];
}

export interface IdeaSummary {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  created_at: string;
}

export interface IdeaDetail extends IdeaSummary {
  sections: IdeaSection[];
  widgets: IdeaWidget[];
}

export async function getIdeas(): Promise<IdeaSummary[]> {
  const res = await fetch(`${BASE_URL}/api/ideas`);
  if (!res.ok) throw new Error("Failed to fetch ideas");
  return res.json();
}

export async function getIdea(slug: string): Promise<IdeaDetail> {
  const res = await fetch(`${BASE_URL}/api/ideas/${slug}`);
  if (!res.ok) throw new Error("Failed to fetch idea");
  return res.json();
}
