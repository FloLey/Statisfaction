import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "../../api";
import { COLORS, computeCumulativeDistance } from "./chartHelpers";

interface Props {
  activities: Activity[];
}

function formatTick(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function CumulativeDistanceChart({ activities }: Props) {
  const data = computeCumulativeDistance(activities);
  if (data.length < 2) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Cumulative Distance
      </h3>
      <p className="text-xs text-gray-400 mb-2">
        Total km over time. Flat sections = breaks.
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.pace} stopOpacity={0.2} />
              <stop offset="95%" stopColor={COLORS.pace} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={formatTick}
            tick={{ fontSize: 11 }}
          />
          <YAxis tick={{ fontSize: 12 }} width={50} unit=" km" />
          <Tooltip
            labelFormatter={(label) => formatTick(Number(label))}
            formatter={(value) => [`${value} km`, "Total"]}
          />
          <Area
            type="monotone"
            dataKey="cumKm"
            stroke={COLORS.pace}
            fill="url(#cumGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
