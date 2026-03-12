import { Todo } from "../api";

interface Props {
  todos: Todo[];
  onDelete: (id: number) => void;
}

export default function TodoList({ todos, onDelete }: Props) {
  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">✓</div>
        <p>No todos yet. Add one above!</p>
      </div>
    );
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <li key={todo.id} className="todo-item">
          <span className="todo-title">{todo.title}</span>
          <button
            onClick={() => onDelete(todo.id)}
            aria-label={`Delete ${todo.title}`}
            className="btn-delete"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
