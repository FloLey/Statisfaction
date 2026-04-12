import { Activity } from "../../api";
import { buildCalendarData } from "./chartHelpers";

interface Props {
  activities: Activity[];
}

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function intensityColor(km: number, maxKm: number): string {
  if (km === 0) return "#f3f4f6"; // gray-100
  const t = Math.min(km / maxKm, 1);
  if (t < 0.25) return "#dbeafe"; // blue-100
  if (t < 0.5) return "#93c5fd"; // blue-300
  if (t < 0.75) return "#3b82f6"; // blue-500
  return "#1d4ed8"; // blue-700
}

export default function ConsistencyCalendarChart({
  activities,
}: Props) {
  if (activities.length < 2) return null;

  const days = buildCalendarData(activities, 26);
  const maxKm = Math.max(...days.map((d) => d.km), 1);
  const totalWeeks = Math.max(...days.map((d) => d.weekIndex)) + 1;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Running Consistency
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        Last 26 weeks. Darker = more distance.
      </p>
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] mr-1">
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="text-[10px] text-gray-400 leading-none"
              style={{ height: 13, display: "flex", alignItems: "center" }}
            >
              {label}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div className="flex gap-[3px]">
          {Array.from({ length: totalWeeks }).map((_, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, di) => {
                const day = days.find(
                  (d) => d.weekIndex === wi && d.weekday === di,
                );
                return (
                  <div
                    key={di}
                    title={
                      day
                        ? `${day.date}: ${day.km > 0 ? day.km.toFixed(1) + " km" : "Rest day"}`
                        : ""
                    }
                    className="rounded-sm"
                    style={{
                      width: 13,
                      height: 13,
                      backgroundColor: day
                        ? intensityColor(day.km, maxKm)
                        : "#f9fafb",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 text-[10px] text-gray-400">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <div
            key={t}
            className="rounded-sm"
            style={{
              width: 11,
              height: 11,
              backgroundColor: intensityColor(t * maxKm, maxKm),
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
