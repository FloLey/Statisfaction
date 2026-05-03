import { useState, useEffect, useMemo } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import {
  getActivities,
  getUserSplits,
  Activity,
  SplitWithActivity,
  User,
} from "../api";
import { formatDistance, formatPace } from "../helpers";
import { useActivityFilters } from "../hooks/useActivityFilters";
import {
  removeOutliers,
  removeSplitOutliers,
  activitiesToSplitLike,
} from "../components/charts/chartHelpers";
import FilterBar from "../components/FilterBar";
import ActivityRow from "../components/ActivityRow";
import SplitRow from "../components/SplitRow";
import ProgressCharts from "../components/charts/ProgressCharts";
import SyncModal from "../components/SyncModal";

type View = "table" | "charts";
type Granularity = "runs" | "splits";

interface LayoutContext {
  users: User[];
  refreshUsers: () => void;
}

export default function Activities() {
  const { userId } = useParams<{ userId: string }>();
  const { users } = useOutletContext<LayoutContext>();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [allSplits, setAllSplits] = useState<SplitWithActivity[]>([]);
  const [showSync, setShowSync] = useState(false);
  const [view, setView] = useState<View>("table");
  const [granularity, setGranularity] = useState<Granularity>("splits");
  const [hideOutliers, setHideOutliers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uid = Number(userId);
  const user = users.find((u) => u.id === uid) ?? null;

  const {
    filters,
    setFilters,
    filteredActivities,
    isFiltered,
    clearFilters,
  } = useActivityFilters(activities);

  const fetchActivities = async () => {
    try {
      const [acts, splits] = await Promise.all([
        getActivities(uid),
        getUserSplits(uid),
      ]);
      setActivities(acts);
      setAllSplits(splits);
    } catch {
      setError("Failed to load activities.");
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [userId]);

  // Filter splits to match filtered activities
  const filteredActivityIds = new Set(filteredActivities.map((a) => a.id));
  const filteredSplits = allSplits.filter((s) =>
    filteredActivityIds.has(s.activity_id),
  );

  // Apply outlier removal
  const cleanActivities = useMemo(
    () => (hideOutliers ? removeOutliers(filteredActivities) : filteredActivities),
    [filteredActivities, hideOutliers],
  );

  const dataPoints: SplitWithActivity[] = useMemo(() => {
    const raw =
      granularity === "splits"
        ? filteredSplits
        : activitiesToSplitLike(cleanActivities);
    return hideOutliers ? removeSplitOutliers(raw) : raw;
  }, [filteredSplits, cleanActivities, granularity, hideOutliers]);

  // Stats — computed from the right granularity
  const stats = useMemo(() => {
    if (granularity === "runs") {
      const totalKm = cleanActivities.reduce(
        (s, a) => s + (a.distance_km ?? 0), 0,
      );
      const paceDuration = cleanActivities.reduce((s, a) =>
        a.duration_min != null && a.distance_km != null
          ? s + a.duration_min : s, 0);
      const paceDistance = cleanActivities.reduce((s, a) =>
        a.duration_min != null && a.distance_km != null
          ? s + a.distance_km : s, 0);
      const avgPace = paceDistance > 0 ? paceDuration / paceDistance : null;
      const hrNumerator = cleanActivities.reduce((s, a) =>
        a.avg_hr != null && a.duration_min != null
          ? s + a.avg_hr * a.duration_min : s, 0);
      const hrDenominator = cleanActivities.reduce((s, a) =>
        a.avg_hr != null && a.duration_min != null
          ? s + a.duration_min : s, 0);
      const avgHr = hrDenominator > 0 ? Math.round(hrNumerator / hrDenominator) : null;
      return [
        { label: "Total Runs", value: String(cleanActivities.length) },
        { label: "Total Distance", value: formatDistance(totalKm) },
        { label: "Avg Pace", value: formatPace(avgPace) },
        { label: "Avg Heart Rate", value: avgHr != null ? `${avgHr} bpm` : "—" },
      ];
    } else {
      const totalKm = dataPoints.reduce(
        (s, sp) => s + (sp.distance_km ?? 0), 0,
      );
      const paceDuration = dataPoints.reduce((s, sp) =>
        sp.duration_min != null && sp.distance_km != null
          ? s + sp.duration_min : s, 0);
      const paceDistance = dataPoints.reduce((s, sp) =>
        sp.duration_min != null && sp.distance_km != null
          ? s + sp.distance_km : s, 0);
      const avgPace = paceDistance > 0 ? paceDuration / paceDistance : null;
      const hrNumerator = dataPoints.reduce((s, sp) =>
        sp.avg_hr != null && sp.duration_min != null
          ? s + sp.avg_hr * sp.duration_min : s, 0);
      const hrDenominator = dataPoints.reduce((s, sp) =>
        sp.avg_hr != null && sp.duration_min != null
          ? s + sp.duration_min : s, 0);
      const avgHr = hrDenominator > 0 ? Math.round(hrNumerator / hrDenominator) : null;
      const uniqueRuns = new Set(dataPoints.map((sp) => sp.activity_id)).size;
      return [
        { label: "Total Splits", value: String(dataPoints.length) },
        { label: `Total Distance (${uniqueRuns} runs)`, value: formatDistance(totalKm) },
        { label: "Avg Split Pace", value: formatPace(avgPace) },
        { label: "Avg Split HR", value: avgHr != null ? `${avgHr} bpm` : "—" },
      ];
    }
  }, [granularity, cleanActivities, dataPoints]);

  const outlierLabel =
    granularity === "splits" ? "Remove outlier splits" : "Remove outlier runs";

  return (
    <div>
      {/* Action bar */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-gray-900">
          {user?.name ?? "Loading..."}
        </h1>
        <div className="flex items-center gap-3">
          {activities.length > 0 && (
            <div className="flex bg-gray-200 rounded-md p-0.5 text-xs font-medium">
              <button
                onClick={() => setView("table")}
                className={`px-3 py-1 rounded transition-colors ${
                  view === "table"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setView("charts")}
                className={`px-3 py-1 rounded transition-colors ${
                  view === "charts"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Charts
              </button>
            </div>
          )}
          <button
            onClick={() => setShowSync(true)}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Sync
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Filter bar */}
      {activities.length > 0 && (
        <FilterBar
          filters={filters}
          onChange={setFilters}
          isFiltered={isFiltered}
          onClear={clearFilters}
          totalCount={activities.length}
          filteredCount={filteredActivities.length}
        />
      )}

      {/* Granularity + outlier controls */}
      {filteredActivities.length > 0 && (
        <div className="flex flex-wrap items-center gap-5 mb-4">
          <div className="flex bg-gray-200 rounded-md p-0.5 text-xs font-medium">
            <button
              onClick={() => setGranularity("runs")}
              className={`px-3 py-1 rounded transition-colors ${
                granularity === "runs"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              By run
            </button>
            <button
              onClick={() => setGranularity("splits")}
              className={`px-3 py-1 rounded transition-colors ${
                granularity === "splits"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              By split
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={hideOutliers}
              onChange={(e) => setHideOutliers(e.target.checked)}
              className="rounded border-gray-300"
            />
            {outlierLabel}
          </label>
        </div>
      )}

      {/* Stat cards */}
      {cleanActivities.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-lg shadow-sm p-4"
            >
              <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">
                {s.label}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {activities.length === 0 && !error && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500 text-sm">
            No activities yet. Click Sync to import from Garmin.
          </p>
        </div>
      )}

      {filteredActivities.length === 0 && activities.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-400 text-sm">
            No activities match your filters.
          </p>
        </div>
      )}

      {cleanActivities.length > 0 && view === "table" && granularity === "runs" && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                  <th className="py-2.5 px-4 font-medium">Date</th>
                  <th className="py-2.5 px-4 font-medium">Name</th>
                  <th className="py-2.5 px-4 font-medium">Distance</th>
                  <th className="py-2.5 px-4 font-medium">Duration</th>
                  <th className="py-2.5 px-4 font-medium">Pace</th>
                  <th className="py-2.5 px-4 font-medium">Avg HR</th>
                  <th className="py-2.5 px-4 font-medium">Elev.</th>
                </tr>
              </thead>
              <tbody>
                {cleanActivities.map((a) => (
                  <ActivityRow key={a.id} activity={a} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dataPoints.length > 0 && view === "table" && granularity === "splits" && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                  <th className="py-2.5 px-4 font-medium">Date</th>
                  <th className="py-2.5 px-4 font-medium">Run</th>
                  <th className="py-2.5 px-4 font-medium">Split</th>
                  <th className="py-2.5 px-4 font-medium">Distance</th>
                  <th className="py-2.5 px-4 font-medium">Duration</th>
                  <th className="py-2.5 px-4 font-medium">Pace</th>
                  <th className="py-2.5 px-4 font-medium">Avg HR</th>
                  <th className="py-2.5 px-4 font-medium">Elev.</th>
                </tr>
              </thead>
              <tbody>
                {dataPoints.map((s) => (
                  <SplitRow key={`${s.activity_id}-${s.split_number}`} split={s} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {cleanActivities.length > 0 && view === "charts" && (
        <ProgressCharts
          activities={cleanActivities}
          splits={dataPoints}
        />
      )}

      {showSync && user && (
        <SyncModal
          userId={user.id}
          onClose={() => setShowSync(false)}
          onSynced={() => {
            setShowSync(false);
            fetchActivities();
          }}
        />
      )}
    </div>
  );
}
