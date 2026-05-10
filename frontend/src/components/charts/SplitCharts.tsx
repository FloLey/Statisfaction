import { useState, useMemo } from "react";
import { Split } from "../../api";
import { markOutliers, filterSplitsByType, DEFAULT_IQR_MULTIPLIER } from "./chartHelpers";
import SplitPaceChart from "./SplitPaceChart";
import SplitHeartRateChart from "./SplitHeartRateChart";
import SplitElevationChart from "./SplitElevationChart";

const ALL_SPLIT_TYPES = ["fast", "running", "walking", "idle"] as const;
const DEFAULT_SELECTED_TYPES = new Set(["fast", "running", "walking", "outliers"]);

const SPLIT_TYPE_LABELS: Record<string, string> = {
  fast: "Fast",
  running: "Running",
  walking: "Walking",
  idle: "Idle",
  outliers: "Outliers",
};

interface Props {
  splits: Split[];
  avgPace: number | null;
  iqrMultiplier?: number;
}

export default function SplitCharts({ splits, avgPace, iqrMultiplier = DEFAULT_IQR_MULTIPLIER }: Props) {
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(DEFAULT_SELECTED_TYPES),
  );

  if (splits.length === 0) return null;

  const markedSplits = useMemo(() => markOutliers(splits, iqrMultiplier), [splits, iqrMultiplier]);
  const showOutliers = selectedTypes.has("outliers");
  const filtered = useMemo(
    () => filterSplitsByType(markedSplits, selectedTypes, showOutliers),
    [markedSplits, selectedTypes, showOutliers],
  );

  const outlierCount = markedSplits.filter((s) => s.isOutlier).length;

  function toggleType(type: string) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex flex-wrap gap-2">
          {ALL_SPLIT_TYPES.map((type) => (
            <label
              key={type}
              className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedTypes.has(type)}
                onChange={() => toggleType(type)}
                className="rounded border-gray-300"
              />
              {SPLIT_TYPE_LABELS[type]}
            </label>
          ))}
          {outlierCount > 0 && (
            <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer border-l border-gray-200 pl-4">
              <input
                type="checkbox"
                checked={showOutliers}
                onChange={() => toggleType("outliers")}
                className="rounded border-gray-300"
              />
              {SPLIT_TYPE_LABELS["outliers"]}
              <span className="text-xs text-gray-400">({outlierCount})</span>
            </label>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SplitPaceChart splits={filtered} avgPace={avgPace} />
        <SplitHeartRateChart splits={filtered} />
        <SplitElevationChart splits={filtered} />
      </div>
    </div>
  );
}
