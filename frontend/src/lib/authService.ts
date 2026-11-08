import { ApiError, get, post } from "@/lib/api";

export type User = { username: string };

export async function currentUser(): Promise<User | null> {
  try {
    return await get<User>("/api/auth/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export function login(username: string, password: string) {
  return post("/api/auth/login", new URLSearchParams({ username, password }));
}

export function register(username: string, password: string) {
  return post("/api/auth/register", JSON.stringify({ username, password }), "application/json");
}

export function logout() {
  return post("/api/auth/logout");
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401: return "Incorrect username or password.";
      case 409: return "That username is already taken.";
      case 400: return "Check your username and password requirements.";
    }
  }
  return "Unable to sign in. Please try again.";
}
