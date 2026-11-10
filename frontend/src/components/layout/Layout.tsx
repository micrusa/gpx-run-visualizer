import Link from "next/link";
import { useRouter } from "next/router";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export function Layout({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const wide = useRouter().pathname === "/runs/[runId]";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function handleLogout() {
    setBusy(true); setError("");
    try { await signOut(); }
    catch { setError("Could not sign out. Please try again."); }
    finally { setBusy(false); }
  }
  return <>
    <header><nav aria-label="Main navigation">
      <Link href="/" className="brand">GPX Run Visualizer</Link>
      {user && <><Link href="/imports">Imports</Link><Link href="/charts">Charts</Link><Link href="/runs">Run view</Link></>}
      <span className="account">{user ? <>{user.username} <button disabled={busy} onClick={handleLogout}>Sign out</button></>
        : !loading && <Link href="/login">Sign in</Link>}</span>
    </nav>{error && <p role="alert" className="error">{error}</p>}</header>
    <main className={wide ? "run-detail-layout" : undefined}>{children}</main>
  </>;
}
