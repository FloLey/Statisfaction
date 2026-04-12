import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "../../api";
import { COLORS, groupByWeekLongestRun } from "./chartHelpers";

interface Props {
  activities: Activity[];
}

export default function LongestRunPerWeekChart({ activities }: Props) {
  const weeks = groupByWeekLongestRun(activities);
  if (weeks.length < 2) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Longest Run per Week
      </h3>
      <p className="text-xs text-gray-400 mb-2">
        Max single-run distance each week.
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
            formatter={(value) => [`${value} km`, "Longest run"]}
          />
          <Bar
            dataKey="maxKm"
            fill={COLORS.elevation}
            fillOpacity={0.7}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
