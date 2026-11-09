import { ApiError, get, post } from "@/lib/api";

export type RunSummary = {
  startedAt: string | null; endedAt: string | null; pointCount: number;
  distanceMeters: number; durationSeconds: number | null; averagePaceSecondsPerKm: number | null;
  elevationGainMeters: number | null; elevationLossMeters: number | null;
  minElevationMeters: number | null; maxElevationMeters: number | null;
  averageHeartRate: number | null; maxHeartRate: number | null;
};
export type ImportedRun = { id: number; name: string; summary: RunSummary };
export type GpxImport = {
  id: number; filename: string; uploadedAt: string; status: "COMPLETED" | "FAILED";
  error: string | null; runs: ImportedRun[];
};

export function recentImports() { return get<GpxImport[]>("/api/imports"); }

export function uploadGpx(files: File[]) {
  if (!files.length) throw new Error("Select at least one GPX file.");
  const body = new FormData();
  files.forEach(file => body.append("files", file));
  return post<GpxImport[]>("/api/imports", body);
}

export function getImportErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) return "Your session expired. Please sign in again.";
  return error instanceof Error ? error.message : "Could not import files. Please try again.";
}
