import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Activity } from "../../api";
import {
  COLORS,
  paceTickFormatter,
  computePaceByDistanceBucket,
} from "./chartHelpers";

interface Props {
  activities: Activity[];
}

export default function PaceByDistanceBucketChart({
  activities,
}: Props) {
  const buckets = computePaceByDistanceBucket(activities);
  const withData = buckets.filter((b) => b.avgPace != null);
  if (withData.length < 2) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Pace by Distance
      </h3>
      <p className="text-xs text-gray-400 mb-2">
        Avg pace per distance range. Shows how you slow for longer runs.
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={buckets}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis
            reversed
            tickFormatter={paceTickFormatter}
            tick={{ fontSize: 12 }}
            width={45}
            domain={["dataMin - 0.3", "dataMax + 0.3"]}
          />
          <Tooltip
            formatter={(value) => {
              const v = Number(value);
              if (isNaN(v)) return ["—", "Pace"];
              return [paceTickFormatter(v) + " /km", "Avg Pace"];
            }}
          />
          <Bar dataKey="avgPace" radius={[4, 4, 0, 0]}>
            {buckets.map((_, i) => (
              <Cell key={i} fill={COLORS.pace} fillOpacity={0.7} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
