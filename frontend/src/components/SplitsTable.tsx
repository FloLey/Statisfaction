import { Split } from "../api";
import { formatDistance, formatDuration, formatPace } from "../helpers";

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
                {formatDistance(s.distance_km)}
              </td>
              <td className="py-2 px-4">
                {formatDuration(s.duration_min)}
              </td>
              <td className="py-2 px-4">
                {formatPace(s.pace_min_km)}
              </td>
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
