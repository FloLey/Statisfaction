import { type Todo } from "../api";

interface Props {
  todo: Todo;
  onDelete: (id: number) => void;
}

export default function TodoItem({ todo, onDelete }: Props) {
  return (
    <li style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0" }}>
      <span>{todo.title}</span>
      <button onClick={() => onDelete(todo.id)} aria-label={`Delete ${todo.title}`}>
        Delete
      </button>
    </li>
  );
}
