import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Split } from "../../api";
import { COLORS, paceTickFormatter } from "./chartHelpers";

interface Props {
  splits: Split[];
  avgPace: number | null;
}

export default function SplitPaceChart({ splits, avgPace }: Props) {
  const data = splits
    .filter((s) => s.pace_min_km != null)
    .map((s) => ({
      split: s.split_number,
      pace: s.pace_min_km!,
    }));

  if (data.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">
        Pace per Split
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="split" tick={{ fontSize: 12 }} />
          <YAxis
            reversed
            domain={["dataMin - 0.5", "dataMax + 0.5"]}
            tickFormatter={paceTickFormatter}
            tick={{ fontSize: 12 }}
            width={45}
          />
          <Tooltip
            formatter={(value) => [
              paceTickFormatter(Number(value)) + " /km",
              "Pace",
            ]}
          />
          {avgPace != null && (
            <ReferenceLine
              y={avgPace}
              stroke={COLORS.gray}
              strokeDasharray="4 4"
              label={{ value: "avg", fontSize: 10, fill: COLORS.gray }}
            />
          )}
          <Bar dataKey="pace" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={
                  avgPace != null && d.pace <= avgPace
                    ? COLORS.elevation
                    : COLORS.amber
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
