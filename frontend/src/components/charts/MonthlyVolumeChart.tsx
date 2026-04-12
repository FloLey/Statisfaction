import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity } from "../../api";
import { COLORS, paceTickFormatter, groupByMonth } from "./chartHelpers";

interface Props {
  activities: Activity[];
}

export default function MonthlyVolumeChart({ activities }: Props) {
  const months = groupByMonth(activities);
  if (months.length < 2) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Monthly Volume + Pace
      </h3>
      <p className="text-xs text-gray-400 mb-2">
        Bars = total km. Line = avg pace.
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={months}>
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis
            yAxisId="km"
            tick={{ fontSize: 12 }}
            width={40}
            unit=" km"
          />
          <YAxis
            yAxisId="pace"
            orientation="right"
            reversed
            tickFormatter={paceTickFormatter}
            tick={{ fontSize: 12 }}
            width={45}
            domain={["dataMin - 0.3", "dataMax + 0.3"]}
          />
          <Tooltip
            formatter={(value, name) => {
              if (name === "avgPace")
                return [paceTickFormatter(Number(value)) + " /km", "Avg Pace"];
              return [`${value} km`, "Volume"];
            }}
          />
          <Bar
            yAxisId="km"
            dataKey="totalKm"
            fill={COLORS.pace}
            fillOpacity={0.3}
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="pace"
            dataKey="avgPace"
            stroke={COLORS.hr}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
