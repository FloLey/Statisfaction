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

interface WeekElevation {
  week: string;
  totalElevation: number;
}

function groupByWeekElevation(activities: Activity[]): WeekElevation[] {
  const weeks = groupByWeek(activities);
  const weekMap = new Map<string, number>();
  for (const a of activities) {
    if (a.elevation_gain_m == null) continue;
    const d = new Date(a.date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    const key = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    weekMap.set(key, (weekMap.get(key) ?? 0) + a.elevation_gain_m);
  }
  return weeks.map((w) => ({
    week: w.week,
    totalElevation: Math.round(weekMap.get(w.week) ?? 0),
  }));
}

export default function WeeklyElevationChart({ activities }: Props) {
  const data = groupByWeekElevation(activities);
  if (data.length < 2) return null;

  const nonZero = data.filter((w) => w.totalElevation > 0);
  if (nonZero.length === 0) return null;

  const avg = Math.round(
    nonZero.reduce((s, w) => s + w.totalElevation, 0) / nonZero.length,
  );

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Weekly Elevation Gain
      </h3>
      <p className="text-xs text-gray-400 mb-2">
        Total D+ per week (m). Dashed line = average over active weeks ({avg} m).
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 12 }} width={45} unit=" m" />
          <Tooltip
            formatter={(value) => [`${value} m`, "D+"]}
          />
          <ReferenceLine
            y={avg}
            stroke={COLORS.gray}
            strokeDasharray="4 4"
          />
          <Bar
            dataKey="totalElevation"
            fill={COLORS.elevation}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
