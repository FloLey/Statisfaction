import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
});

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Activity {
  id: number;
  garmin_id: string;
  name: string;
  date: string;
  distance_km: number | null;
  duration_min: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  avg_pace_min_km: number | null;
  elevation_gain_m: number | null;
}

export interface Split {
  split_number: number;
  distance_km: number | null;
  duration_min: number | null;
  pace_min_km: number | null;
  avg_hr: number | null;
  elevation_gain_m: number | null;
  split_type: string | null;
}

export interface ActivityDetailResponse extends Activity {
  splits: Split[];
}

export interface SplitWithActivity extends Split {
  activity_id: number;
  activity_name: string;
  activity_date: string;
}

export interface SyncResult {
  synced: number;
  total: number;
}

export async function getUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>("/api/users");
  return data;
}

export async function createUser(
  name: string,
  email: string,
): Promise<User> {
  const { data } = await api.post<User>("/api/users", { name, email });
  return data;
}

export async function syncUser(
  userId: number,
  password: string,
): Promise<SyncResult> {
  const { data } = await api.post<SyncResult>(
    `/api/users/${userId}/sync`,
    { password },
  );
  return data;
}

export async function getActivities(
  userId: number,
): Promise<Activity[]> {
  const { data } = await api.get<Activity[]>(
    `/api/users/${userId}/activities`,
  );
  return data;
}

export async function getUserSplits(
  userId: number,
): Promise<SplitWithActivity[]> {
  const { data } = await api.get<SplitWithActivity[]>(
    `/api/users/${userId}/splits`,
  );
  return data;
}

export async function reclassifySplits(
  userId: number,
): Promise<{ updated_splits: number }> {
  const { data } = await api.post<{ updated_splits: number }>(
    `/api/users/${userId}/reclassify`,
  );
  return data;
}

export async function getActivityDetail(
  activityId: number,
): Promise<ActivityDetailResponse> {
  const { data } = await api.get<ActivityDetailResponse>(
    `/api/activities/${activityId}`,
  );
  return data;
}
