import { ActivityFilters } from "../hooks/useActivityFilters";

interface Props {
  filters: ActivityFilters;
  onChange: (filters: ActivityFilters) => void;
  isFiltered: boolean;
  onClear: () => void;
  totalCount: number;
  filteredCount: number;
}

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
