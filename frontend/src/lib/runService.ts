import { ApiError, get } from "@/lib/api";

export type Run = {
  id: number; startedAt: string | null; distanceMeters: number;
  durationSeconds: number | null; averagePaceSecondsPerKm: number | null;
  elevationGainMeters: number | null; averageHeartRate: number | null;
};

export type RunPage = { content: Run[]; page: number; size: number; totalPages: number; totalElements: number };

export function listRuns(page = 0) { return get<RunPage>(`/api/runs?page=${page}&size=20`); }

export function getRunErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) return "Your session expired. Please sign in again.";
  return "Could not load runs. Please try again.";
}
