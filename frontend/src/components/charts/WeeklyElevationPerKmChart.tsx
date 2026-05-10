import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "../../api";
import { COLORS, groupByWeek } from "./chartHelpers";

interface Props {
  activities: Activity[];
}

export default function WeeklyElevationPerKmChart({ activities }: Props) {
  const weeks = groupByWeek(activities);
  if (weeks.length < 2) return null;

  // Build lookup: week label → { totalElevation, totalKm }
  const weekMap = new Map<string, { elev: number; km: number }>();
  for (const a of activities) {
    if (a.elevation_gain_m == null || a.distance_km == null) continue;
    const d = new Date(a.date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    const key = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const prev = weekMap.get(key) ?? { elev: 0, km: 0 };
    weekMap.set(key, { elev: prev.elev + a.elevation_gain_m, km: prev.km + a.distance_km });
  }

  const data = weeks.map((w) => {
    const entry = weekMap.get(w.week);
    const elevPerKm = entry && entry.km > 0
      ? Math.round((entry.elev / entry.km) * 10) / 10
      : 0;
    return { week: w.week, elevPerKm };
  });

  const nonZero = data.filter((w) => w.elevPerKm > 0);
  if (nonZero.length === 0) return null;

  const avg = Math.round(
    (nonZero.reduce((s, w) => s + w.elevPerKm, 0) / nonZero.length) * 10,
  ) / 10;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Weekly Elevation Density
      </h3>
      <p className="text-xs text-gray-400 mb-2">
        D+ per km per week (m/km). Dashed line = average over active weeks ({avg} m/km).
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 12 }} width={45} unit=" m/km" />
          <Tooltip
            formatter={(value) => [`${value} m/km`, "D+/km"]}
          />
          <ReferenceLine
            y={avg}
            stroke={COLORS.gray}
            strokeDasharray="4 4"
          />
          <Bar
            dataKey="elevPerKm"
            fill={COLORS.amber}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
