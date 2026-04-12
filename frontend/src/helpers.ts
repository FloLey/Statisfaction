export function formatPace(paceMinKm: number | null): string {
  if (paceMinKm == null) return "—";
  const mins = Math.floor(paceMinKm);
  const secs = Math.round((paceMinKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")} /km`;
}

export function formatDuration(durationMin: number | null): string {
  if (durationMin == null) return "—";
  const totalSecs = Math.round(durationMin * 60);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatDistance(km: number | null): string {
  if (km == null) return "—";
  return `${km.toFixed(2)} km`;
}

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
