import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router-dom";
import {
  getActivities,
  getUserSplits,
  getUserSettings,
  Activity,
  SplitWithActivity,
  User,
} from "../api";
import { formatDistance, formatPace } from "../helpers";
import { useActivityFilters } from "../hooks/useActivityFilters";
import {
  markOutliers,
  filterSplitsByType,
  filterNonRunningActivities,
  computePaceFromSplits,
  computeHrFromSplits,
  activitiesToSplitLike,
  MarkedSplit,
  DEFAULT_IQR_MULTIPLIER,
} from "../components/charts/chartHelpers";
import FilterBar from "../components/FilterBar";
import ActivityRow from "../components/ActivityRow";
import SplitRow from "../components/SplitRow";
import ProgressCharts from "../components/charts/ProgressCharts";
import SyncModal from "../components/SyncModal";

type View = "table" | "charts";
type Granularity = "runs" | "splits";

const ALL_SPLIT_TYPES = ["fast", "running", "walking", "idle"] as const;
const DEFAULT_SELECTED_TYPES = new Set(["fast", "running", "walking"]);

const SPLIT_TYPE_LABELS: Record<string, string> = {
  fast: "Fast",
  running: "Running",
  walking: "Walking",
  idle: "Idle",
};

interface LayoutContext {
  users: User[];
  refreshUsers: () => void;
}

export default function Activities() {
  const { userId } = useParams<{ userId: string }>();
  const { users } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [allSplits, setAllSplits] = useState<SplitWithActivity[]>([]);
  const [iqrMultiplier, setIqrMultiplier] = useState(DEFAULT_IQR_MULTIPLIER);
  const [showSync, setShowSync] = useState(false);
  const [view, setView] = useState<View>("table");
  const [granularity, setGranularity] = useState<Granularity>("splits");
  const [selectedSplitTypes, setSelectedSplitTypes] = useState<Set<string>>(
    new Set(DEFAULT_SELECTED_TYPES),
  );
  const [showSplitFilter, setShowSplitFilter] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const splitFilterRef = useRef<HTMLDivElement>(null);

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
      const [acts, splits, settings] = await Promise.all([
        getActivities(uid),
        getUserSplits(uid),
        getUserSettings(uid),
      ]);
      setActivities(acts);
      setAllSplits(splits);
      setIqrMultiplier(settings.iqr_multiplier);
    } catch {
      setError("Failed to load activities.");
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [userId]);

  // Close split filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (splitFilterRef.current && !splitFilterRef.current.contains(e.target as Node)) {
        setShowSplitFilter(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter splits to match filtered activities
  const filteredActivityIds = new Set(filteredActivities.map((a) => a.id));
  const filteredSplits = allSplits.filter((s) =>
    filteredActivityIds.has(s.activity_id),
  );

  // Exclude activities composed entirely of idle/walk splits (hikes, walks)
  const runningSplits = useMemo(
    () => filterNonRunningActivities(filteredSplits),
    [filteredSplits],
  );
  const runningActivityIds = useMemo(
    () => new Set(runningSplits.map((s) => s.activity_id)),
    [runningSplits],
  );
  const runningActivities = useMemo(
    () => filteredActivities.filter((a) => runningActivityIds.has(a.id)),
    [filteredActivities, runningActivityIds],
  );

  // Mark outliers, then filter by selected types + outlier preference
  const markedSplits: MarkedSplit<SplitWithActivity>[] = useMemo(
    () => markOutliers(runningSplits, iqrMultiplier),
    [runningSplits, iqrMultiplier],
  );

  const showOutliers = selectedSplitTypes.has("outliers");
  const cleanSplits: MarkedSplit<SplitWithActivity>[] = useMemo(
    () => filterSplitsByType(markedSplits, selectedSplitTypes, showOutliers),
    [markedSplits, selectedSplitTypes, showOutliers],
  );

  const dataPoints: MarkedSplit<SplitWithActivity>[] = useMemo(() => {
    if (granularity === "splits") return cleanSplits;
    return activitiesToSplitLike(runningActivities).map((s) => ({
      ...s,
      isOutlier: false,
    }));
  }, [cleanSplits, runningActivities, granularity]);

  // Stats — in "runs" mode, pace/HR come from filtered splits when available
  const stats = useMemo(() => {
    if (granularity === "runs") {
      const totalKm = runningActivities.reduce(
        (s, a) => s + (a.distance_km ?? 0),
        0,
      );
      const avgPace = computePaceFromSplits(cleanSplits);
      const avgHr = computeHrFromSplits(cleanSplits);
      return [
        { label: "Total Runs", value: String(runningActivities.length) },
        { label: "Total Distance", value: formatDistance(totalKm) },
        { label: "Avg Pace", value: formatPace(avgPace) },
        { label: "Avg Heart Rate", value: avgHr != null ? `${avgHr} bpm` : "—" },
      ];
    } else {
      const totalKm = dataPoints.reduce(
        (s, sp) => s + (sp.distance_km ?? 0),
        0,
      );
      const avgPace = computePaceFromSplits(dataPoints);
      const avgHr = computeHrFromSplits(dataPoints);
      const uniqueRuns = new Set(dataPoints.map((sp) => sp.activity_id)).size;
      return [
        { label: "Total Splits", value: String(dataPoints.length) },
        { label: `Total Distance (${uniqueRuns} runs)`, value: formatDistance(totalKm) },
        { label: "Avg Split Pace", value: formatPace(avgPace) },
        { label: "Avg Split HR", value: avgHr != null ? `${avgHr} bpm` : "—" },
      ];
    }
  }, [granularity, runningActivities, cleanSplits, dataPoints]);

  function toggleType(type: string) {
    setSelectedSplitTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  const filterSummary = ALL_SPLIT_TYPES.filter((t) =>
    selectedSplitTypes.has(t),
  )
    .map((t) => SPLIT_TYPE_LABELS[t])
    .concat(showOutliers ? ["Outliers"] : [])
    .join(", ");

  const outlierCount = markedSplits.filter((s) => s.isOutlier).length;

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
            onClick={() => navigate(`/users/${userId}/settings`)}
            title="Classification settings"
            className="px-3 py-1.5 text-sm border border-gray-300 bg-white text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
          >
            ⚙️
          </button>
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

      {/* Granularity + split type filter controls */}
      {filteredActivities.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
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

          {/* Split type filter dropdown */}
          <div className="relative" ref={splitFilterRef}>
            <button
              onClick={() => setShowSplitFilter((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span>Split types: {filterSummary || "None"}</span>
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showSplitFilter && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                {ALL_SPLIT_TYPES.map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSplitTypes.has(type)}
                      onChange={() => toggleType(type)}
                      className="rounded border-gray-300"
                    />
                    {SPLIT_TYPE_LABELS[type]}
                  </label>
                ))}
                {outlierCount > 0 && (
                  <>
                    <div className="border-t border-gray-100 my-1" />
                    <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={showOutliers}
                        onChange={() => toggleType("outliers")}
                        className="rounded border-gray-300"
                      />
                      Outliers
                      <span className="ml-auto text-xs text-gray-400">
                        {outlierCount}
                      </span>
                    </label>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stat cards */}
      {filteredActivities.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-lg shadow-sm p-4">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">
                {s.label}
              </p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
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

      {runningActivities.length > 0 && view === "table" && granularity === "runs" && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                  <th className="py-2.5 px-4 font-medium">Date</th>
                  <th className="py-2.5 px-4 font-medium">Name</th>
                  <th className="py-2.5 px-4 font-medium">Type</th>
                  <th className="py-2.5 px-4 font-medium">Distance</th>
                  <th className="py-2.5 px-4 font-medium">Duration</th>
                  <th className="py-2.5 px-4 font-medium">Pace</th>
                  <th className="py-2.5 px-4 font-medium">Avg HR</th>
                  <th className="py-2.5 px-4 font-medium">Elev.</th>
                </tr>
              </thead>
              <tbody>
                {runningActivities.map((a) => (
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
                  <th className="py-2.5 px-4 font-medium">Type</th>
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

      {runningActivities.length > 0 && view === "charts" && (
        <ProgressCharts
          activities={runningActivities}
          splits={dataPoints}
          granularity={granularity}
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
