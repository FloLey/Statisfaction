import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "../../api";
import { COLORS, bucketDistances } from "./chartHelpers";

interface Props {
  activities: Activity[];
}

export default function DistanceDistribution({ activities }: Props) {
  const buckets = bucketDistances(activities);
  const hasData = buckets.some((b) => b.count > 0);
  if (!hasData) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Distance Distribution
      </h3>
      <p className="text-xs text-gray-400 mb-2">
        How often you run each distance range.
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={buckets}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} width={30} allowDecimals={false} />
          <Tooltip
            formatter={(value) => [`${value} runs`, "Count"]}
          />
          <Bar
            dataKey="count"
            fill={COLORS.elevation}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
