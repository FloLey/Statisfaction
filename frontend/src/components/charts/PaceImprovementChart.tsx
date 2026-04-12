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
import { Activity } from "../../api";
import { COLORS, computePaceImprovement } from "./chartHelpers";

interface Props {
  activities: Activity[];
}

export default function PaceImprovementChart({ activities }: Props) {
  const data = computePaceImprovement(activities);
  if (data.length < 2) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Pace Improvement %
      </h3>
      <p className="text-xs text-gray-400 mb-2">
        vs previous month. Positive = faster.
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            width={45}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(1)}%`, "Change"]}
          />
          <ReferenceLine y={0} stroke={COLORS.gray} />
          <Bar dataKey="pctChange" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.pctChange >= 0 ? COLORS.elevation : COLORS.hr}
                fillOpacity={0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
