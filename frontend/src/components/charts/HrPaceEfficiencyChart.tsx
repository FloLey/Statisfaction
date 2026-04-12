import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { SplitWithActivity } from "../../api";
import { paceTickFormatter } from "./chartHelpers";

interface Props {
  splits: SplitWithActivity[];
}

export default function HrPaceEfficiencyChart({ splits }: Props) {
  const valid = splits.filter(
    (s) => s.pace_min_km != null && s.avg_hr != null,
  );
  if (valid.length < 2) return null;

  // Sort chronologically so index-based color = time gradient
  const sorted = [...valid].sort((a, b) =>
    a.activity_date.localeCompare(b.activity_date) ||
    a.split_number - b.split_number,
  );

  const data = sorted.map((s, i) => ({
    pace: s.pace_min_km!,
    hr: s.avg_hr!,
    date: s.activity_date,
    name: s.activity_name,
    // pre-compute color so it's embedded in the data
    color: `hsl(${Math.round((i / Math.max(sorted.length - 1, 1)) * 130)}, 75%, 50%)`,
  }));

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        HR vs Pace Efficiency (splits)
      </h3>
      <p className="text-xs text-gray-400 mb-2">
        Red = older, green = recent. Shifting down-right = improving.
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <ScatterChart>
          <XAxis
            dataKey="pace"
            type="number"
            name="Pace"
            tickFormatter={paceTickFormatter}
            tick={{ fontSize: 12 }}
            reversed
            domain={["dataMin - 0.3", "dataMax + 0.3"]}
          />
          <YAxis
            dataKey="hr"
            type="number"
            name="HR"
            tick={{ fontSize: 12 }}
            width={40}
            unit=" bpm"
            domain={["dataMin - 5", "dataMax + 5"]}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === "Pace")
                return [paceTickFormatter(Number(value)) + " /km", name];
              return [`${value} bpm`, name];
            }}
          />
          <Scatter data={data}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
