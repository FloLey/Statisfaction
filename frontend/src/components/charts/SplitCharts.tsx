import { useState, useMemo } from "react";
import { Split } from "../../api";
import { markOutliers, filterSplitsByType } from "./chartHelpers";
import SplitPaceChart from "./SplitPaceChart";
import SplitHeartRateChart from "./SplitHeartRateChart";
import SplitElevationChart from "./SplitElevationChart";

const ALL_SPLIT_TYPES = ["fast", "running", "walking", "idle"] as const;
const DEFAULT_SELECTED_TYPES = new Set(["fast", "running", "walking"]);

const SPLIT_TYPE_LABELS: Record<string, string> = {
  fast: "Fast",
  running: "Running",
  walking: "Walking",
  idle: "Idle",
};

interface Props {
  splits: Split[];
  avgPace: number | null;
}

export default function SplitCharts({ splits, avgPace }: Props) {
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(DEFAULT_SELECTED_TYPES),
  );
  const [hideOutliers, setHideOutliers] = useState(true);

  if (splits.length === 0) return null;

  const markedSplits = useMemo(() => markOutliers(splits), [splits]);
  const filtered = useMemo(
    () => filterSplitsByType(markedSplits, selectedTypes, hideOutliers),
    [markedSplits, selectedTypes, hideOutliers],
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
        </div>
        <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer border-l border-gray-200 pl-4">
          <input
            type="checkbox"
            checked={hideOutliers}
            onChange={(e) => setHideOutliers(e.target.checked)}
            className="rounded border-gray-300"
          />
          Hide outliers
          {outlierCount > 0 && (
            <span className="text-xs text-gray-400">({outlierCount})</span>
          )}
        </label>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SplitPaceChart splits={filtered} avgPace={avgPace} />
        <SplitHeartRateChart splits={filtered} />
        <SplitElevationChart splits={filtered} />
      </div>
    </div>
  );
}
