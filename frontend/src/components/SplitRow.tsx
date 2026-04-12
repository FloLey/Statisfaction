import { useNavigate } from "react-router-dom";
import { SplitWithActivity } from "../api";
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatPace,
} from "../helpers";

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
      <td className="py-2 px-4 text-gray-500">
        #{split.split_number}
      </td>
      <td className="py-2 px-4">
        {formatDistance(split.distance_km)}
      </td>
      <td className="py-2 px-4">
        {formatDuration(split.duration_min)}
      </td>
      <td className="py-2 px-4">
        {formatPace(split.pace_min_km)}
      </td>
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
