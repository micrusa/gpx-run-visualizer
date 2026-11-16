import { ApiError, get } from "@/lib/api";

export type Run = {
  id: number; name?: string; startedAt: string | null; distanceMeters: number;
  durationSeconds: number | null; averagePaceSecondsPerKm: number | null;
  elevationGainMeters: number | null; averageHeartRate: number | null;
};

export type RunPoint = {
  index: number; segment: number; latitude: number; longitude: number;
  distanceMeters: number; timeSeconds: number | null; paceSecondsPerKm: number | null;
  elevationMeters: number | null; gradePercent: number | null; heartRate: number | null;
};
export type RunDetail = { summary: Run; points: RunPoint[] };

export function getRun(id: string) { return get<RunDetail>(`/api/runs/${encodeURIComponent(id)}`); }

export type RunPage = { content: Run[]; page: number; size: number; totalPages: number; totalElements: number };

export function listRuns(page = 0) { return get<RunPage>(`/api/runs?page=${page}&size=20`); }

export function getRunErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) return "Your session expired. Please sign in again.";
  if (error instanceof ApiError && error.status === 404) return "Run not found.";
  return "Could not load runs. Please try again.";
}
