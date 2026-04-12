import { useState } from "react";
import { syncUser } from "../api";

interface Props {
  userId: number;
  onClose: () => void;
  onSynced: () => void;
}

export default function SyncModal({ userId, onClose, onSynced }: Props) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await syncUser(userId, password);
      setResult(`${data.synced} new activities added.`);
      setTimeout(onSynced, 2000);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(detail ?? "Sync failed.");
    } finally {
      setLoading(false);
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
        <h2 className="text-xl font-bold mb-2">Sync Activities</h2>
        <p className="text-sm text-gray-500 mb-4">
          Enter your Garmin password to sync latest activities.
        </p>

        {result ? (
          <p className="text-green-600 font-medium">{result}</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Garmin password"
              required
              className="w-full border border-gray-200 bg-gray-50 rounded-md px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && (
              <p className="text-red-600 text-sm mb-3">{error}</p>
            )}
            {loading && (
              <p className="text-blue-600 text-sm mb-3">Syncing...</p>
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
                className="bg-green-600 text-white px-3 py-1.5 text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Syncing..." : "Sync"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
