import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SplitWithActivity } from "../../api";
import { COLORS, computeMovingAverage } from "./chartHelpers";

interface Props {
  splits: SplitWithActivity[];
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: { size: number };
}

function SizedDot({ cx, cy, payload }: DotProps) {
  if (cx == null || cy == null) return null;
  const r = payload?.size ?? 2;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={COLORS.hr}
      fillOpacity={0.3}
      stroke={COLORS.hr}
      strokeWidth={0.5}
    />
  );
}

function formatTick(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function HeartRateTrendChart({ splits }: Props) {
  const valid = splits.filter((s) => s.avg_hr != null);
  if (valid.length < 2) return null;

  const hrs = valid.map((s) => s.avg_hr);
  const durations = valid.map((s) => s.duration_min ?? null);
  const isRunMode = valid.every((s) => s.split_number === 1);
  const window = isRunMode ? 5 : Math.min(20, Math.floor(valid.length / 3));
  const ma = computeMovingAverage(hrs, Math.max(window, 2), durations);

  const distances = valid.map((s) => s.distance_km ?? 0);
  const maxDist = Math.max(...distances, 1);

  const dateLabels = new Map<number, string>();
  if (!isRunMode) {
    let lastDate = "";
    valid.forEach((s, i) => {
      if (s.activity_date !== lastDate) {
        dateLabels.set(i, new Date(s.activity_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }));
        lastDate = s.activity_date;
      }
    });
  }

  const data = valid.map((s, i) => ({
    x: isRunMode ? new Date(s.activity_date).getTime() : i,
    hr: s.avg_hr,
    ma: ma[i],
    size: isRunMode ? 1.5 + ((s.distance_km ?? 0) / maxDist) * 4.5 : 2,
  }));

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Heart Rate Trend
      </h3>
      <p className="text-xs text-gray-400 mb-2">
        {isRunMode ? "Dot size = distance. " : ""}Line = {Math.max(window, 2)}-{isRunMode ? "run" : "split"} moving average.
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={data}>
          <XAxis
            dataKey="x"
            type="number"
            scale={isRunMode ? "time" : "linear"}
            domain={["dataMin", "dataMax"]}
            tickFormatter={isRunMode
              ? formatTick
              : (idx: number) => dateLabels.get(idx) ?? ""
            }
            tick={{ fontSize: 11 }}
            ticks={isRunMode ? undefined : Array.from(dateLabels.keys())}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            width={40}
            unit=" bpm"
            domain={["dataMin - 3", "dataMax + 3"]}
          />
          <Tooltip
            labelFormatter={(label) =>
              isRunMode
                ? formatTick(Number(label))
                : `Split ${Number(label) + 1}`
            }
            formatter={(value, name) => {
              if (name === "size") return [null, null];
              return [
                `${Number(value).toFixed(0)} bpm`,
                name === "ma" ? "Avg trend" : "Avg HR",
              ];
            }}
          />
          <Line
            dataKey="hr"
            stroke="none"
            dot={<SizedDot />}
            activeDot={<SizedDot />}
          />
          <Line
            dataKey="ma"
            stroke={COLORS.hr}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
