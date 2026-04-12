import { useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { getUsers, User } from "../api";
import AddUserModal from "./AddUserModal";

export default function Layout() {
  const [users, setUsers] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const location = useLocation();

  const fetchUsers = async () => {
    try {
      setUsers(await getUsers());
    } catch {
      /* sidebar degrades gracefully */
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Extract active userId from URL
  const userMatch = location.pathname.match(/\/users\/(\d+)/);
  const activeUserId = userMatch ? Number(userMatch[1]) : null;

  // Build breadcrumb
  const crumbs: { label: string; to?: string }[] = [
    { label: "Statisfaction", to: "/" },
  ];
  if (activeUserId) {
    const u = users.find((u) => u.id === activeUserId);
    crumbs.push({
      label: u?.name ?? "...",
      to: `/users/${activeUserId}`,
    });
  }
  if (location.pathname.startsWith("/activities/")) {
    crumbs.push({ label: "Run Detail" });
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 text-gray-900 flex flex-col shrink-0">
        <Link
          to="/"
          className="px-5 py-5 text-lg font-bold tracking-tight border-b border-gray-200"
        >
          Statisfaction
        </Link>

        <div className="px-3 pt-4 pb-2">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 px-2">
            Users
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {users.map((u) => (
            <Link
              key={u.id}
              to={`/users/${u.id}`}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                activeUserId === u.id
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {u.name}
            </Link>
          ))}
          {users.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-400">
              No users yet
            </p>
          )}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => setShowAdd(true)}
            className="w-full px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            + Add User
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center shrink-0">
          <nav className="flex items-center text-sm">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center">
                {i > 0 && (
                  <span className="mx-2 text-gray-300">/</span>
                )}
                {c.to && i < crumbs.length - 1 ? (
                  <Link
                    to={c.to}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-gray-900 font-medium">
                    {c.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <Outlet context={{ users, refreshUsers: fetchUsers }} />
        </main>
      </div>

      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}
