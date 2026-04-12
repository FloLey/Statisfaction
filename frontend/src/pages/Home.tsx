import { useOutletContext } from "react-router-dom";
import { User } from "../api";

interface LayoutContext {
  users: User[];
  refreshUsers: () => void;
}

export default function Home() {
  const { users } = useOutletContext<LayoutContext>();

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Welcome to Statisfaction
          </h2>
          <p className="text-gray-500 text-sm">
            Add a user from the sidebar to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Select a user
        </h2>
        <p className="text-gray-500 text-sm">
          Pick a user from the sidebar to view their running stats.
        </p>
      </div>
    </div>
  );
}
