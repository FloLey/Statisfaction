import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "../../api";
import { paceTickFormatter } from "./chartHelpers";

const RUN_TYPE_COLORS: Record<string, string> = {
  easy: "#60a5fa",
  long: "#a78bfa",
  tempo: "#f59e0b",
  sprints: "#f87171",
  hills: "#22c55e",
  unknown: "#9ca3af",
};

const RUN_TYPE_LABELS: Record<string, string> = {
  easy: "Easy",
  long: "Long",
  tempo: "Tempo",
  sprints: "Sprints",
  hills: "Hills",
  unknown: "Unclassified",
};

// Ordered slowest-to-fastest for a sensible horizontal bar layout
const RUN_TYPE_ORDER = ["easy", "long", "hills", "tempo", "sprints", "unknown"];

export default function PaceByRunTypeChart({ activities }: { activities: Activity[] }) {
  const typeMap = new Map<string, { totalDuration: number; totalDist: number }>();
  for (const a of activities) {
    if (a.duration_min == null || a.distance_km == null || a.distance_km === 0) continue;
    const type = a.run_type ?? "unknown";
    const existing = typeMap.get(type) ?? { totalDuration: 0, totalDist: 0 };
    typeMap.set(type, {
      totalDuration: existing.totalDuration + a.duration_min,
      totalDist: existing.totalDist + a.distance_km,
    });
  }

  const data = RUN_TYPE_ORDER.filter((t) => typeMap.has(t))
    .map((type) => {
      const { totalDuration, totalDist } = typeMap.get(type)!;
      return {
        type,
        label: RUN_TYPE_LABELS[type] ?? type,
        avgPace: Math.round((totalDuration / totalDist) * 100) / 100,
      };
    })
    .filter((d) => d.avgPace > 0);

  if (data.length === 0) return null;

  // Domain: a bit looser than min/max
  const paces = data.map((d) => d.avgPace);
  const minPace = Math.max(0, Math.min(...paces) - 0.5);
  const maxPace = Math.max(...paces) + 0.3;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Average Pace by Run Type
      </h3>
      <p className="text-xs text-gray-400 mb-2">
        Duration-weighted average pace per type — sprints and tempo should be significantly faster than easy.
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical">
          <XAxis
            type="number"
            domain={[minPace, maxPace]}
            tickFormatter={paceTickFormatter}
            tick={{ fontSize: 12 }}
            reversed
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 12 }}
            width={72}
          />
          <Tooltip
            formatter={(value) => [paceTickFormatter(Number(value)) + " /km", "Avg pace"]}
          />
          <Bar dataKey="avgPace" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.type}
                fill={RUN_TYPE_COLORS[entry.type] ?? "#9ca3af"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
