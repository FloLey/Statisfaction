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
import { COLORS, computeRunFrequency } from "./chartHelpers";

interface Props {
  activities: Activity[];
}

export default function RunFrequencyChart({ activities }: Props) {
  const data = computeRunFrequency(activities);
  if (data.length < 2) return null;

  const avg =
    Math.round(
      (data.reduce((s, d) => s + d.runs, 0) / data.length) * 10,
    ) / 10;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Run Frequency
      </h3>
      <p className="text-xs text-gray-400 mb-2">
        Runs per week. Dashed line = average ({avg}).
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            width={30}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value) => [`${value} runs`, "Count"]}
          />
          <ReferenceLine
            y={avg}
            stroke={COLORS.gray}
            strokeDasharray="4 4"
          />
          <Bar
            dataKey="runs"
            fill={COLORS.pace}
            fillOpacity={0.5}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
