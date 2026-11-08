import { useState, type FormEvent } from "react";
import { useRouter } from "next/router";
import { login, register, getAuthErrorMessage } from "@/lib/authService";
import { useAuth } from "@/components/auth/AuthProvider";

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { refresh } = useAuth();
  const router = useRouter();
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (mode === "register") await register(username, password);
      await login(username, password);
      setPassword("");
      await refresh();
      await router.push("/");
    } catch (error) {
      setError(getAuthErrorMessage(error));
      setPassword("");
    } finally { setBusy(false); }
  }
  return (
    <section className="card auth-card">
      <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
      <form onSubmit={submit}>
        <label htmlFor="username">Username</label>
        <input id="username" autoComplete="username" required minLength={3} maxLength={50}
          pattern="[a-z0-9_-]+" value={username} onChange={e => setUsername(e.target.value)}
          aria-describedby="username-help" disabled={busy} />
        <small id="username-help">3–50 lowercase letters, numbers, underscores or hyphens.</small>
        <label htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"}
          required minLength={mode === "register" ? 8 : undefined} maxLength={128}
          value={password} onChange={e => setPassword(e.target.value)} disabled={busy}
          aria-describedby={mode === "register" ? "password-help" : undefined} />
        {mode === "register" && <small id="password-help">Use 8–128 characters.</small>}
        {error && <p role="alert" className="error">{error}</p>}
        <button type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
      </form>
      <button className="text-button" disabled={busy} onClick={() => {
        setMode(mode === "login" ? "register" : "login"); setError(""); setPassword("");
      }}>{mode === "login" ? "New here? Create an account" : "Already registered? Sign in"}</button>
    </section>
  );
}
