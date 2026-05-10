import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "../../api";
import { groupByWeek } from "./chartHelpers";

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

const RUN_TYPE_ORDER = ["easy", "long", "tempo", "hills", "sprints", "unknown"];

interface WeekTypeData {
  week: string;
  [key: string]: number | string;
}

export default function VolumeByRunTypeChart({ activities }: { activities: Activity[] }) {
  const weeks = groupByWeek(activities);
  if (weeks.length < 2) return null;

  // Build week → type → km map
  const weekTypeMap = new Map<string, Map<string, number>>();
  for (const a of activities) {
    if (a.distance_km == null) continue;
    const d = new Date(a.date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    const weekLabel = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const type = a.run_type ?? "unknown";
    if (!weekTypeMap.has(weekLabel)) weekTypeMap.set(weekLabel, new Map());
    const typeMap = weekTypeMap.get(weekLabel)!;
    typeMap.set(type, (typeMap.get(type) ?? 0) + a.distance_km);
  }

  // Determine which run types actually appear
  const presentTypes = new Set<string>();
  for (const a of activities) {
    presentTypes.add(a.run_type ?? "unknown");
  }
  const orderedTypes = RUN_TYPE_ORDER.filter((t) => presentTypes.has(t));

  const data: WeekTypeData[] = weeks.map((w) => {
    const typeMap = weekTypeMap.get(w.week);
    const row: WeekTypeData = { week: w.week };
    for (const type of orderedTypes) {
      row[type] = Math.round((typeMap?.get(type) ?? 0) * 10) / 10;
    }
    return row;
  });

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Weekly Volume by Run Type
      </h3>
      <p className="text-xs text-gray-400 mb-2">
        Weekly km split by training type — shows balance of easy aerobic base vs quality sessions.
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 12 }} width={40} unit=" km" />
          <Tooltip
            formatter={(value, name) => [
              `${value} km`,
              RUN_TYPE_LABELS[String(name)] ?? String(name),
            ]}
          />
          <Legend
            formatter={(value) => RUN_TYPE_LABELS[value] ?? value}
          />
          {orderedTypes.map((type) => (
            <Bar
              key={type}
              dataKey={type}
              stackId="a"
              fill={RUN_TYPE_COLORS[type] ?? "#9ca3af"}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
