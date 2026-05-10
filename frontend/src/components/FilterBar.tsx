import { useState, useRef, useEffect } from "react";
import { ActivityFilters } from "../hooks/useActivityFilters";

interface Props {
  filters: ActivityFilters;
  onChange: (filters: ActivityFilters) => void;
  isFiltered: boolean;
  onClear: () => void;
  totalCount: number;
  filteredCount: number;
}

const RUN_TYPE_LABELS: Record<string, string> = {
  easy: "Easy",
  long: "Long",
  tempo: "Tempo",
  sprints: "Sprints",
  hills: "Hills",
};
const ALL_RUN_TYPES = ["easy", "long", "tempo", "sprints", "hills"];

export default function FilterBar({
  filters,
  onChange,
  isFiltered,
  onClear,
  totalCount,
  filteredCount,
}: Props) {
  const set = (patch: Partial<ActivityFilters>) =>
    onChange({ ...filters, ...patch });

  const [showRunTypeFilter, setShowRunTypeFilter] = useState(false);
  const runTypeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (runTypeRef.current && !runTypeRef.current.contains(e.target as Node)) {
        setShowRunTypeFilter(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleRunType = (type: string) => {
    const next = new Set(filters.runTypes);
    next.has(type) ? next.delete(type) : next.add(type);
    set({ runTypes: next });
  };

  const runTypeLabel =
    filters.runTypes.size === 0
      ? "All run types"
      : [...filters.runTypes].map((t) => RUN_TYPE_LABELS[t] ?? t).join(", ");

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Date range */}
        <select
          value={filters.dateRange}
          onChange={(e) =>
            set({ dateRange: e.target.value as ActivityFilters["dateRange"] })
          }
          className="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All time</option>
          <option value="last30">Last 30 days</option>
          <option value="last90">Last 90 days</option>
          <option value="lastYear">Last year</option>
          <option value="custom">Custom range</option>
        </select>

        {filters.dateRange === "custom" && (
          <>
            <input
              type="date"
              value={filters.customFrom}
              onChange={(e) => set({ customFrom: e.target.value })}
              className="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={filters.customTo}
              onChange={(e) => set({ customTo: e.target.value })}
              className="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </>
        )}

        {/* Distance range */}
        <select
          value={filters.distanceRange}
          onChange={(e) =>
            set({
              distanceRange: e.target.value as ActivityFilters["distanceRange"],
            })
          }
          className="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All distances</option>
          <option value="short">Short (&lt;5 km)</option>
          <option value="medium">Medium (5-12 km)</option>
          <option value="long">Long (&gt;12 km)</option>
        </select>

        {/* Run type multi-select */}
        <div className="relative" ref={runTypeRef}>
          <button
            onClick={() => setShowRunTypeFilter((v) => !v)}
            className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          >
            <span>{runTypeLabel}</span>
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showRunTypeFilter && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
              {ALL_RUN_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={filters.runTypes.has(type)}
                    onChange={() => toggleRunType(type)}
                    className="rounded border-gray-300"
                  />
                  {RUN_TYPE_LABELS[type]}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Name search */}
        <input
          type="text"
          placeholder="Search by name..."
          value={filters.nameSearch}
          onChange={(e) => set({ nameSearch: e.target.value })}
          className="text-sm border border-gray-200 rounded-md px-2.5 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
        />

        {/* Clear + count */}
        <div className="flex items-center gap-2 ml-auto">
          {isFiltered && (
            <>
              <span className="text-xs text-gray-400">
                {filteredCount} of {totalCount}
              </span>
              <button
                onClick={onClear}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear filters
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
