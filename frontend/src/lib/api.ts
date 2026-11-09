export class ApiError extends Error {
  constructor(public status: number, detail?: string) {
    super(detail ?? `Request failed: ${status}`);
  }
}

export async function get<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store", credentials: "same-origin" });
  if (!response.ok) throw await apiError(response);
  return response.json();
}

// Fetch a fresh token per mutation: Spring rotates it after login and logout.
export async function post<T = void>(path: string, body?: BodyInit, contentType?: string): Promise<T> {
  const csrf = await get<{ headerName: string; token: string }>("/api/auth/csrf");
  const response = await fetch(path, {
    method: "POST", credentials: "same-origin", body,
    headers: { [csrf.headerName]: csrf.token, ...(contentType ? { "Content-Type": contentType } : {}) },
  });
  if (!response.ok) throw await apiError(response);
  return response.headers.get("content-type")?.includes("json") ? response.json() : undefined as T;
}

async function apiError(response: Response): Promise<ApiError> {
  const problem = await response.json().catch(() => null);
  return new ApiError(response.status, problem?.detail);
}
