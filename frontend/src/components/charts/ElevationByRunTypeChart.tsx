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

const RUN_TYPE_ORDER = ["hills", "long", "tempo", "sprints", "easy", "unknown"];

export default function ElevationByRunTypeChart({ activities }: { activities: Activity[] }) {
  const typeMap = new Map<string, { totalElev: number; totalDist: number; count: number }>();
  for (const a of activities) {
    if (a.elevation_gain_m == null || a.distance_km == null || a.distance_km === 0) continue;
    const type = a.run_type ?? "unknown";
    const existing = typeMap.get(type) ?? { totalElev: 0, totalDist: 0, count: 0 };
    typeMap.set(type, {
      totalElev: existing.totalElev + a.elevation_gain_m,
      totalDist: existing.totalDist + a.distance_km,
      count: existing.count + 1,
    });
  }

  const data = RUN_TYPE_ORDER.filter((t) => typeMap.has(t))
    .map((type) => {
      const { totalElev, totalDist } = typeMap.get(type)!;
      return {
        type,
        label: RUN_TYPE_LABELS[type] ?? type,
        elevPerKm: Math.round((totalElev / totalDist) * 10) / 10,
      };
    })
    .filter((d) => d.elevPerKm > 0);

  if (data.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Elevation Gain by Run Type
      </h3>
      <p className="text-xs text-gray-400 mb-2">
        Average D+/km per run type — confirms hills runs are the hilliest, easy runs are flat.
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical">
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            unit=" m/km"
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 12 }}
            width={72}
          />
          <Tooltip
            formatter={(value) => [`${value} m/km`, "Avg D+/km"]}
          />
          <Bar dataKey="elevPerKm" radius={[0, 4, 4, 0]}>
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
