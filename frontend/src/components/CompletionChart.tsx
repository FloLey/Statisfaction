import { DailyStat } from "../api";

interface BarChartProps {
  title: string;
  stats: DailyStat[];
  color: string;
}

function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${month}/${day}`;
}

function BarChart({ title, stats, color }: BarChartProps) {
  const maxCount = Math.max(...stats.map((s) => s.count), 1);

  return (
    <div className="chart-section">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-container">
        {stats.map((stat) => (
          <div key={stat.date} className="chart-bar-group">
            <span className="chart-bar-value">{stat.count}</span>
            <div
              className="chart-bar"
              style={{
                height: `${(stat.count / maxCount) * 100}%`,
                backgroundColor: color,
              }}
            />
            <span className="chart-bar-label">{formatDate(stat.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  completedStats: DailyStat[];
  createdStats: DailyStat[];
}

export default function CompletionChart({ completedStats, createdStats }: Props) {
  if (completedStats.length === 0 && createdStats.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <p>No stats yet. Create and complete some tasks!</p>
      </div>
    );
  }

  return (
    <div className="charts-wrapper">
      {createdStats.length > 0 && (
        <BarChart title="Tasks Created" stats={createdStats} color="#4f46e5" />
      )}
      {completedStats.length > 0 && (
        <BarChart title="Tasks Completed" stats={completedStats} color="#059669" />
      )}
    </div>
  );
}
