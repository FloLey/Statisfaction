import { type Todo } from "../api";
import TodoItem from "./TodoItem";
import "./TodoList.css";

interface Props {
  todos: Todo[];
  onDelete: (id: number) => void;
}

export default function TodoList({ todos, onDelete }: Props) {
  if (todos.length === 0) {
    return <p>No todos yet.</p>;
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onDelete={onDelete} />
      ))}
    </ul>
  );
}
