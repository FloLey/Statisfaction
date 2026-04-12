import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Split } from "../../api";
import { COLORS } from "./chartHelpers";

interface Props {
  splits: Split[];
}

export default function SplitHeartRateChart({ splits }: Props) {
  const data = splits
    .filter((s) => s.avg_hr != null)
    .map((s) => ({
      split: s.split_number,
      hr: s.avg_hr!,
    }));

  if (data.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">
        Heart Rate per Split
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.hr} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.hr} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey="split" tick={{ fontSize: 12 }} />
          <YAxis
            domain={["dataMin - 5", "dataMax + 5"]}
            tick={{ fontSize: 12 }}
            width={40}
            unit=" bpm"
          />
          <Tooltip
            formatter={(value) => [`${value} bpm`, "Avg HR"]}
          />
          <Area
            type="monotone"
            dataKey="hr"
            stroke={COLORS.hr}
            fill="url(#hrGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
