import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser, syncUser } from "../api";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function AddUserModal({ onClose, onCreated }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<"create" | "sync">("create");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await createUser(name.trim(), email.trim());
      setUserId(user.id);
      setStep("sync");
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(detail ?? "Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userId == null) return;
    setLoading(true);
    setError(null);
    try {
      await syncUser(userId, password);
      onCreated();
      navigate(`/users/${userId}`);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(detail ?? "Sync failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (userId != null) {
      onCreated();
      navigate(`/users/${userId}`);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-5 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "create" && (
          <form onSubmit={handleCreate}>
            <h2 className="text-xl font-bold mb-4">Add User</h2>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Garmin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && (
              <p className="text-red-600 text-sm mb-3">{error}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Next"}
              </button>
            </div>
          </form>
        )}

        {step === "sync" && (
          <form onSubmit={handleSync}>
            <h2 className="text-xl font-bold mb-2">
              Import Activities
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Enter your Garmin password to import your running data.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Garmin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && (
              <p className="text-red-600 text-sm mb-3">{error}</p>
            )}
            {loading && (
              <p className="text-blue-600 text-sm mb-3">
                Importing activities... This may take a minute.
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Syncing..." : "Import"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
