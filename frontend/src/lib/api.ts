export class ApiError extends Error {
  constructor(public status: number) {
    super(`Request failed: ${status}`);
  }
}

export async function get<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store", credentials: "same-origin" });
  if (!response.ok) throw new ApiError(response.status);
  return response.json();
}

// Fetch a fresh token per mutation: Spring rotates it after login and logout.
export async function post(path: string, body?: BodyInit, contentType?: string): Promise<void> {
  const csrf = await get<{ headerName: string; token: string }>("/api/auth/csrf");
  const response = await fetch(path, {
    method: "POST", credentials: "same-origin", body,
    headers: { [csrf.headerName]: csrf.token, ...(contentType ? { "Content-Type": contentType } : {}) },
  });
  if (!response.ok) throw new ApiError(response.status);
}
