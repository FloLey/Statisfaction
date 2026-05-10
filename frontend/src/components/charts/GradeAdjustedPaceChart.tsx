import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { SplitWithActivity } from "../../api";
import {
  COLORS,
  paceTickFormatter,
  computeMovingAverage,
  MarkedSplit,
} from "./chartHelpers";

interface Props {
  splits: MarkedSplit<SplitWithActivity>[];
}

function computeGAP(pace: number, elevationGain: number, distanceKm: number): number {
  if (distanceKm <= 0) return pace;
  const gradePercent = (elevationGain / (distanceKm * 1000)) * 100;
  if (gradePercent >= 0) {
    // Uphill: Strava approximation (~3.3% slower per 1% grade)
    return pace / (1 + 0.033 * gradePercent);
  } else {
    // Downhill: diminishing benefit (~1.6% per 1% grade)
    return pace / (1 - 0.016 * Math.abs(gradePercent));
  }
}

function formatTick(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function GradeAdjustedPaceChart({ splits }: Props) {
  const valid = splits.filter(
    (s) =>
      s.pace_min_km != null &&
      s.elevation_gain_m != null &&
      s.distance_km != null,
  );
  if (valid.length < 2) return null;

  const isRunMode = valid.every((s) => s.split_number === 1);
  const window = isRunMode ? 5 : Math.min(20, Math.floor(valid.length / 3));
  const w = Math.max(window, 2);

  const rawPaces = valid.map((s) => s.pace_min_km!);
  const gapValues = valid.map((s) =>
    computeGAP(s.pace_min_km!, s.elevation_gain_m!, s.distance_km!),
  );
  const weights = valid.map((s) => s.distance_km ?? null);

  const maRaw = computeMovingAverage(rawPaces, w, weights);
  const maGap = computeMovingAverage(gapValues, w, weights);

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
    rawPace: s.pace_min_km,
    gap: Math.round(gapValues[i] * 100) / 100,
    maRaw: maRaw[i],
    maGap: maGap[i],
    elevDiff: Math.round((rawPaces[i] - gapValues[i]) * 60), // seconds difference
  }));

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Grade-Adjusted Pace
      </h3>
      <p className="text-xs text-gray-400 mb-2">
        GAP (solid) removes terrain bias — same fitness, hilly course = slower raw pace (dashed). {w}-{isRunMode ? "run" : "split"} moving averages shown.
      </p>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={data}>
          <XAxis
            dataKey="x"
            type="number"
            scale={isRunMode ? "time" : "linear"}
            domain={["dataMin", "dataMax"]}
            tickFormatter={
              isRunMode
                ? formatTick
                : (idx: number) => dateLabels.get(idx) ?? ""
            }
            tick={{ fontSize: 11 }}
            ticks={isRunMode ? undefined : Array.from(dateLabels.keys())}
          />
          <YAxis
            reversed
            domain={["dataMin - 0.3", "dataMax + 0.3"]}
            tickFormatter={paceTickFormatter}
            tick={{ fontSize: 12 }}
            width={45}
          />
          <Tooltip
            labelFormatter={(label) =>
              isRunMode ? formatTick(Number(label)) : `Split ${Number(label) + 1}`
            }
            formatter={(value, name) => {
              const v = Number(value);
              if (isNaN(v)) return [null, null];
              if (name === "maRaw") return [paceTickFormatter(v) + " /km", "Raw pace trend"];
              if (name === "maGap") return [paceTickFormatter(v) + " /km", "GAP trend"];
              if (name === "rawPace") return [paceTickFormatter(v) + " /km", "Raw pace"];
              if (name === "gap") return [paceTickFormatter(v) + " /km", "GAP"];
              return [null, null];
            }}
          />
          <Legend
            formatter={(value) =>
              value === "maRaw" ? "Raw pace" : "Grade-adjusted pace"
            }
          />
          {/* Moving averages only — raw scatter is too noisy */}
          <Line
            dataKey="maRaw"
            stroke={COLORS.pace}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
            connectNulls
          />
          <Line
            dataKey="maGap"
            stroke="#1d4ed8"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
