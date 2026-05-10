import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getActivityDetail, getUserSettings, ActivityDetailResponse } from "../api";
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatPace,
} from "../helpers";
import SplitCharts from "../components/charts/SplitCharts";
import SplitsTable from "../components/SplitsTable";
import RunTypeBadge from "../components/RunTypeBadge";
import { DEFAULT_IQR_MULTIPLIER } from "../components/charts/chartHelpers";

export default function ActivityDetail() {
  const { activityId } = useParams<{ activityId: string }>();
  const [activity, setActivity] = useState<ActivityDetailResponse | null>(null);
  const [iqrMultiplier, setIqrMultiplier] = useState(DEFAULT_IQR_MULTIPLIER);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const act = await getActivityDetail(Number(activityId));
        setActivity(act);
        const settings = await getUserSettings(act.user_id);
        setIqrMultiplier(settings.iqr_multiplier);
      } catch {
        setError("Activity not found.");
      }
    };
    load();
  }, [activityId]);

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="text-gray-400 text-sm">Loading...</div>
    );
  }

  const stats = [
    { label: "Distance", value: formatDistance(activity.distance_km) },
    { label: "Duration", value: formatDuration(activity.duration_min) },
    { label: "Pace", value: formatPace(activity.avg_pace_min_km) },
    {
      label: "Avg HR",
      value: activity.avg_hr != null ? `${activity.avg_hr} bpm` : "—",
    },
    {
      label: "Max HR",
      value: activity.max_hr != null ? `${activity.max_hr} bpm` : "—",
    },
    {
      label: "Elevation",
      value:
        activity.elevation_gain_m != null
          ? `${activity.elevation_gain_m} m`
          : "—",
    },
  ];

  return (
    <div>
      {/* Header card */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-5">
        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-semibold text-gray-900">
              {activity.name}
            </h1>
            <RunTypeBadge runType={activity.run_type} />
          </div>
          <span className="text-sm text-gray-400">
            {formatDate(activity.date)}
          </span>
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-[11px] uppercase tracking-wider text-gray-400">
                {s.label}
              </p>
              <p className="text-lg font-bold text-gray-900">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Split charts */}
      {activity.splits.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Split Analysis
          </h2>
          <SplitCharts
            splits={activity.splits}
            avgPace={activity.avg_pace_min_km}
            iqrMultiplier={iqrMultiplier}
          />
        </div>
      )}

      {/* Splits table */}
      {activity.splits.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              Splits
            </h2>
          </div>
          <SplitsTable splits={activity.splits} />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-400 text-sm">
            No split data available for this activity.
          </p>
        </div>
      )}
    </div>
  );
}
