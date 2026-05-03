import { useNavigate } from "react-router-dom";
import { SplitWithActivity } from "../api";
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatPace,
} from "../helpers";

const SPLIT_TYPE_STYLES: Record<string, string> = {
  fast: "bg-orange-100 text-orange-700",
  running: "bg-blue-100 text-blue-700",
  walking: "bg-yellow-100 text-yellow-700",
  idle: "bg-gray-100 text-gray-500",
};

interface Props {
  split: SplitWithActivity;
}

export default function SplitRow({ split }: Props) {
  const navigate = useNavigate();

  return (
    <tr
      onClick={() => navigate(`/activities/${split.activity_id}`)}
      className="border-b border-gray-50 hover:bg-blue-50/50 cursor-pointer even:bg-gray-50/50"
    >
      <td className="py-2 px-4 text-gray-500">
        {formatDate(split.activity_date)}
      </td>
      <td className="py-2 px-4 font-medium text-gray-900">
        {split.activity_name}
      </td>
      <td className="py-2 px-4 text-gray-500">#{split.split_number}</td>
      <td className="py-2 px-4">
        {split.split_type ? (
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${
              SPLIT_TYPE_STYLES[split.split_type] ?? "bg-gray-100 text-gray-500"
            }`}
          >
            {split.split_type}
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>
      <td className="py-2 px-4">{formatDistance(split.distance_km)}</td>
      <td className="py-2 px-4">{formatDuration(split.duration_min)}</td>
      <td className="py-2 px-4">{formatPace(split.pace_min_km)}</td>
      <td className="py-2 px-4">
        {split.avg_hr != null ? `${split.avg_hr}` : "—"}
      </td>
      <td className="py-2 px-4">
        {split.elevation_gain_m != null
          ? `${split.elevation_gain_m} m`
          : "—"}
      </td>
    </tr>
  );
}
