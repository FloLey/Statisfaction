import { useState } from "react";
import { Split } from "../../api";
import { removeSplitOutliers } from "./chartHelpers";
import SplitPaceChart from "./SplitPaceChart";
import SplitHeartRateChart from "./SplitHeartRateChart";
import SplitElevationChart from "./SplitElevationChart";

interface Props {
  splits: Split[];
  avgPace: number | null;
}

export default function SplitCharts({ splits, avgPace }: Props) {
  const [hideOutliers, setHideOutliers] = useState(false);

  if (splits.length === 0) return null;

  const filtered = hideOutliers ? removeSplitOutliers(splits) : splits;

  return (
    <div>
      <label className="flex items-center gap-2 mb-4 text-sm text-gray-500 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={hideOutliers}
          onChange={(e) => setHideOutliers(e.target.checked)}
          className="rounded border-gray-300"
        />
        Remove outlier splits
      </label>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SplitPaceChart splits={filtered} avgPace={avgPace} />
        <SplitHeartRateChart splits={filtered} />
        <SplitElevationChart splits={filtered} />
      </div>
    </div>
  );
}
