import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "../../api";

const RUN_TYPE_COLORS: Record<string, string> = {
  easy: "#60a5fa",     // blue-400
  long: "#a78bfa",     // violet-400
  tempo: "#f59e0b",    // amber-500
  sprints: "#f87171",  // red-400
  hills: "#22c55e",    // green-500
  unknown: "#9ca3af",  // gray-400
};

const RUN_TYPE_LABELS: Record<string, string> = {
  easy: "Easy",
  long: "Long",
  tempo: "Tempo",
  sprints: "Sprints",
  hills: "Hills",
  unknown: "Unclassified",
};

type Mode = "count" | "km";

export default function RunTypeDistributionChart({ activities }: { activities: Activity[] }) {
  const [mode, setMode] = useState<Mode>("count");

  const typeMap = new Map<string, { count: number; km: number }>();
  for (const a of activities) {
    const type = a.run_type ?? "unknown";
    const existing = typeMap.get(type) ?? { count: 0, km: 0 };
    typeMap.set(type, {
      count: existing.count + 1,
      km: existing.km + (a.distance_km ?? 0),
    });
  }

  const data = Array.from(typeMap.entries())
    .map(([type, { count, km }]) => ({
      name: RUN_TYPE_LABELS[type] ?? type,
      type,
      value: mode === "count" ? count : Math.round(km * 10) / 10,
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-700">
          Run Type Distribution
        </h3>
        <div className="flex bg-gray-100 rounded p-0.5 text-xs font-medium">
          <button
            onClick={() => setMode("count")}
            className={`px-2 py-0.5 rounded transition-colors ${
              mode === "count"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Runs
          </button>
          <button
            onClick={() => setMode("km")}
            className={`px-2 py-0.5 rounded transition-colors ${
              mode === "km"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            km
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-2">
        {mode === "count"
          ? `${total} runs total — breakdown by run type.`
          : `${Math.round(total)} km total — km share by run type.`}
      </p>
      <div style={{ width: "100%", height: 250 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell
                key={entry.type}
                fill={RUN_TYPE_COLORS[entry.type] ?? RUN_TYPE_COLORS.unknown}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, _name, props) => [
              mode === "count"
                ? `${value} runs (${Math.round((Number(value) / total) * 100)}%)`
                : `${value} km (${Math.round((Number(value) / total) * 100)}%)`,
              props.payload?.name ?? "",
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
