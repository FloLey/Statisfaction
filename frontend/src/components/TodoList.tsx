import { Todo } from "../api";

interface Props {
  todos: Todo[];
  onDelete: (id: number) => void;
}

export default function TodoList({ todos, onDelete }: Props) {
  if (todos.length === 0) {
    return <p>No todos yet. Add one above!</p>;
  }

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {todos.map((todo) => (
        <li
          key={todo.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.5rem 0",
            borderBottom: "1px solid #eee",
          }}
        >
          <span>{todo.title}</span>
          <button
            onClick={() => onDelete(todo.id)}
            aria-label={`Delete ${todo.title}`}
            style={{ padding: "0.25rem 0.75rem", cursor: "pointer" }}
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
