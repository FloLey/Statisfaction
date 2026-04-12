import { useNavigate } from "react-router-dom";
import { Activity } from "../api";
import {
  formatDate,
  formatDistance,
  formatDuration,
  formatPace,
} from "../helpers";

interface Props {
  activity: Activity;
}

export default function ActivityRow({ activity }: Props) {
  const navigate = useNavigate();

  return (
    <tr
      onClick={() => navigate(`/activities/${activity.id}`)}
      className="border-b border-gray-50 hover:bg-blue-50/50 cursor-pointer even:bg-gray-50/50"
    >
      <td className="py-2 px-4 text-gray-500">
        {formatDate(activity.date)}
      </td>
      <td className="py-2 px-4 font-medium text-gray-900">
        {activity.name}
      </td>
      <td className="py-2 px-4">
        {formatDistance(activity.distance_km)}
      </td>
      <td className="py-2 px-4">
        {formatDuration(activity.duration_min)}
      </td>
      <td className="py-2 px-4">
        {formatPace(activity.avg_pace_min_km)}
      </td>
      <td className="py-2 px-4">
        {activity.avg_hr != null ? `${activity.avg_hr}` : "—"}
      </td>
      <td className="py-2 px-4">
        {activity.elevation_gain_m != null
          ? `${activity.elevation_gain_m} m`
          : "—"}
      </td>
    </tr>
  );
}
