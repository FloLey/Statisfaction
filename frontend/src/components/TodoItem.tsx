import { type Todo } from "../api";
import "./TodoItem.css";

interface Props {
  todo: Todo;
  onDelete: (id: number) => void;
}

export default function TodoItem({ todo, onDelete }: Props) {
  return (
    <li className="todo-item">
      <span>{todo.title}</span>
      <button onClick={() => onDelete(todo.id)} aria-label={`Delete ${todo.title}`}>
        Delete
      </button>
    </li>
  );
}
