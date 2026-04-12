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

export default function WeeklyMileageChart({ activities }: Props) {
  const weeks = groupByWeek(activities);
  if (weeks.length < 2) return null;

  const avg =
    Math.round(
      (weeks.reduce((s, w) => s + w.totalKm, 0) / weeks.length) * 10,
    ) / 10;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Weekly Mileage
      </h3>
      <p className="text-xs text-gray-400 mb-2">
        Total km per week. Dashed line = average ({avg} km).
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={weeks}>
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 12 }} width={40} unit=" km" />
          <Tooltip
            formatter={(value) => [`${value} km`, "Total"]}
          />
          <ReferenceLine
            y={avg}
            stroke={COLORS.gray}
            strokeDasharray="4 4"
          />
          <Bar
            dataKey="totalKm"
            fill={COLORS.pace}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
