import { useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SplitWithActivity } from "../../api";
import { paceTickFormatter, gradeAdjustedPace } from "./chartHelpers";

type Granularity = "runs" | "splits";

interface Props {
  splits: SplitWithActivity[];
  granularity: Granularity;
}

export default function HrPaceEfficiencyChart({ splits, granularity }: Props) {
  const [useGAP, setUseGAP] = useState(false);

  const valid = splits.filter(
    (s) => s.pace_min_km != null && s.avg_hr != null,
  );
  if (valid.length < 2) return null;

  const sorted = [...valid].sort((a, b) =>
    a.activity_date.localeCompare(b.activity_date) ||
    a.split_number - b.split_number,
  );

  const maxDuration = Math.max(...sorted.map((s) => s.duration_min ?? 1));

  const data = sorted.map((s, i) => {
    const pace = useGAP
      ? gradeAdjustedPace(s.pace_min_km!, s.elevation_gain_m, s.distance_km)
      : s.pace_min_km!;
    const duration = s.duration_min ?? 1;
    // Dot radius scaled by duration: short sprints get r=3, long splits up to r=8
    const r = 3 + Math.round((duration / maxDuration) * 5);
    return {
      pace,
      hr: s.avg_hr!,
      date: s.activity_date,
      name: s.activity_name,
      r,
      color: `hsl(${Math.round((i / Math.max(sorted.length - 1, 1)) * 130)}, 75%, 50%)`,
    };
  });

  const label = granularity === "runs" ? "runs" : "splits";

  return (
    <div>
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-700">
          HR vs Pace Efficiency ({label})
        </h3>
        <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs flex-shrink-0">
          <button
            onClick={() => setUseGAP(false)}
            className={`px-2 py-0.5 transition-colors ${!useGAP ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
          >
            Pace
          </button>
          <button
            onClick={() => setUseGAP(true)}
            className={`px-2 py-0.5 transition-colors ${useGAP ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
          >
            GAP
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-2">
        Red = older, green = recent. Dot size = duration (larger = more reliable HR).
        {useGAP && " GAP removes elevation effect from pace."}
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <ScatterChart>
          <XAxis
            dataKey="pace"
            type="number"
            name={useGAP ? "GAP" : "Pace"}
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
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-white border border-gray-200 rounded shadow-sm px-3 py-2 text-xs space-y-0.5">
                  <p className="font-medium text-gray-700">
                    {new Date(d.date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  {d.name && <p className="text-gray-400">{d.name}</p>}
                  <p className="text-gray-600">{useGAP ? "GAP" : "Pace"}: {paceTickFormatter(d.pace)} /km</p>
                  <p className="text-gray-600">HR: {d.hr} bpm</p>
                </div>
              );
            }}
          />
          <Scatter
            data={data}
            shape={(props: any) => {
              const { cx, cy, payload } = props;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={payload.r}
                  fill={payload.color}
                  fillOpacity={0.75}
                />
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
