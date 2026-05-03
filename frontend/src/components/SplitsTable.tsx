import { Split } from "../api";
import { formatDistance, formatDuration, formatPace } from "../helpers";

const SPLIT_TYPE_STYLES: Record<string, string> = {
  fast: "bg-orange-100 text-orange-700",
  running: "bg-blue-100 text-blue-700",
  walking: "bg-yellow-100 text-yellow-700",
  idle: "bg-gray-100 text-gray-500",
};

interface Props {
  splits: Split[];
}

export default function SplitsTable({ splits }: Props) {
  const fastestIdx = splits.reduce(
    (best, s, i) => {
      if (s.pace_min_km == null) return best;
      if (best === -1) return i;
      const bestPace = splits[best].pace_min_km;
      if (bestPace == null) return i;
      return s.pace_min_km < bestPace ? i : best;
    },
    -1,
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
            <th className="py-2.5 px-5 font-medium">Split #</th>
            <th className="py-2.5 px-4 font-medium">Type</th>
            <th className="py-2.5 px-4 font-medium">Distance</th>
            <th className="py-2.5 px-4 font-medium">Time</th>
            <th className="py-2.5 px-4 font-medium">Pace</th>
            <th className="py-2.5 px-4 font-medium">Avg HR</th>
            <th className="py-2.5 px-4 font-medium">Elev. Gain</th>
          </tr>
        </thead>
        <tbody>
          {splits.map((s, i) => (
            <tr
              key={s.split_number}
              className={`border-b border-gray-50 even:bg-gray-50/50 ${
                i === fastestIdx ? "bg-green-50" : ""
              }`}
            >
              <td className="py-2 px-5">{s.split_number}</td>
              <td className="py-2 px-4">
                {s.split_type ? (
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      SPLIT_TYPE_STYLES[s.split_type] ?? "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {s.split_type}
                  </span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </td>
              <td className="py-2 px-4">{formatDistance(s.distance_km)}</td>
              <td className="py-2 px-4">{formatDuration(s.duration_min)}</td>
              <td className="py-2 px-4">{formatPace(s.pace_min_km)}</td>
              <td className="py-2 px-4">
                {s.avg_hr != null ? `${s.avg_hr}` : "—"}
              </td>
              <td className="py-2 px-4">
                {s.elevation_gain_m != null
                  ? `${s.elevation_gain_m} m`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
