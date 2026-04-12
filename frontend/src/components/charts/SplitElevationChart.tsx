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

export default function SplitElevationChart({ splits }: Props) {
  const data = splits
    .filter((s) => s.elevation_gain_m != null)
    .map((s) => ({
      split: s.split_number,
      elev: s.elevation_gain_m!,
    }));

  if (data.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">
        Elevation per Split
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={COLORS.elevation}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={COLORS.elevation}
                stopOpacity={0.05}
              />
            </linearGradient>
          </defs>
          <XAxis dataKey="split" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            width={40}
            unit=" m"
          />
          <Tooltip
            formatter={(value) => [`${value} m`, "Elevation"]}
          />
          <Area
            type="monotone"
            dataKey="elev"
            stroke={COLORS.elevation}
            fill="url(#elevGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
