import { Todo } from "../api";

interface Props {
  todos: Todo[];
  onDelete: (id: number) => void;
  onComplete: (id: number) => void;
  showCompleteAction: boolean;
  emptyMessage?: string;
}

export default function TodoList({
  todos,
  onDelete,
  onComplete,
  showCompleteAction,
  emptyMessage = "No todos yet. Add one above!",
}: Props) {
  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">{showCompleteAction ? "+" : "✓"}</div>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <li key={todo.id} className="todo-item">
          <span
            className={`todo-title${todo.completed_at ? " todo-title--done" : ""}`}
          >
            {todo.title}
          </span>
          <div className="todo-actions">
            {showCompleteAction ? (
              <button
                onClick={() => onComplete(todo.id)}
                aria-label={`Complete ${todo.title}`}
                className="btn-complete"
              >
                Done
              </button>
            ) : (
              <button
                onClick={() => onComplete(todo.id)}
                aria-label={`Undo ${todo.title}`}
                className="btn-undo"
              >
                Undo
              </button>
            )}
            <button
              onClick={() => onDelete(todo.id)}
              aria-label={`Delete ${todo.title}`}
              className="btn-delete"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
