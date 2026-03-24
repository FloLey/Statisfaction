import { useEffect } from "react";

interface DocsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DocsModal({ open, onClose }: DocsModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="docs-overlay" onClick={onClose}>
      <div
        className="docs-modal"
        role="dialog"
        aria-label="Documentation"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="docs-header">
          <h2>Documentation</h2>
          <button className="docs-close" onClick={onClose} aria-label="Close documentation">
            &times;
          </button>
        </div>
        <div className="docs-body">
          <section>
            <h3>Getting Started</h3>
            <p>
              Statisfaction is a simple todo tracker. Add tasks using the input
              field at the top of the card and press <strong>Add</strong>. Click{" "}
              <strong>Done</strong> to mark a task as complete, or{" "}
              <strong>Delete</strong> to remove it. Use the tabs to switch
              between active tasks, completed tasks, and daily stats.
            </p>
          </section>

          <section>
            <h3>API Reference</h3>
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Path</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>GET</code></td>
                  <td><code>/api/health</code></td>
                  <td>Health check</td>
                </tr>
                <tr>
                  <td><code>GET</code></td>
                  <td><code>/api/todos</code></td>
                  <td>List all items</td>
                </tr>
                <tr>
                  <td><code>POST</code></td>
                  <td><code>/api/todos</code></td>
                  <td>Create an item</td>
                </tr>
                <tr>
                  <td><code>PATCH</code></td>
                  <td><code>/api/todos/&#123;id&#125;/complete</code></td>
                  <td>Toggle task completion</td>
                </tr>
                <tr>
                  <td><code>DELETE</code></td>
                  <td><code>/api/todos/&#123;id&#125;</code></td>
                  <td>Delete an item by id</td>
                </tr>
                <tr>
                  <td><code>GET</code></td>
                  <td><code>/api/todos/stats/daily</code></td>
                  <td>Daily creation &amp; completion counts</td>
                </tr>
              </tbody>
            </table>
            <p>
              <strong>POST</strong> body: <code>&#123;"title": "string"&#125;</code>
            </p>
          </section>

          <section>
            <h3>Tech Stack</h3>
            <ul>
              <li><strong>Frontend:</strong> React 18 + Vite + TypeScript</li>
              <li><strong>Backend:</strong> FastAPI (Python 3.12) + SQLAlchemy async</li>
              <li><strong>Database:</strong> PostgreSQL 16</li>
            </ul>
          </section>

          <section>
            <h3>Keyboard Shortcuts</h3>
            <ul>
              <li><kbd>Esc</kbd> &mdash; Close this dialog</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
