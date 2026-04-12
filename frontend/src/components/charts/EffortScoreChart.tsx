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

function formatTick(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function EffortScoreChart({ splits }: Props) {
  const valid = splits.filter(
    (s) => s.pace_min_km != null && s.avg_hr != null,
  );
  if (valid.length < 2) return null;

  const efforts = valid.map((s) => Math.round(s.pace_min_km! * s.avg_hr!));
  const isRunMode = valid.every((s) => s.split_number === 1);
  const window = isRunMode ? 5 : Math.min(20, Math.floor(valid.length / 3));
  const ma = computeMovingAverage(efforts, Math.max(window, 2));

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
    effort: efforts[i],
    ma: ma[i],
  }));

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Effort Score
      </h3>
      <p className="text-xs text-gray-400 mb-2">
        Pace x HR. Lower = more efficient. Line = {Math.max(window, 2)}-{isRunMode ? "run" : "split"} avg.
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
            width={45}
            domain={["dataMin - 20", "dataMax + 20"]}
          />
          <Tooltip
            labelFormatter={(label) =>
              isRunMode
                ? formatTick(Number(label))
                : `Split ${Number(label) + 1}`
            }
            formatter={(value, name) => {
              if (name === "ma")
                return [Number(value).toFixed(0), "Avg trend"];
              return [Number(value).toFixed(0), "Effort"];
            }}
          />
          <Line
            dataKey="effort"
            stroke={COLORS.amber}
            strokeWidth={0}
            dot={{ r: 2, fill: COLORS.amber, fillOpacity: 0.3 }}
            activeDot={{ r: 3 }}
          />
          <Line
            dataKey="ma"
            stroke={COLORS.amber}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
