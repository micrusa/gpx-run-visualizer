import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { RunsPanel } from "@/components/runs/RunsPanel";

export function RunList() {
  const { user, loading, error } = useAuth();
  if (loading) return <p role="status">Loading…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!user) return <p><Link href="/login">Sign in</Link> to view your runs.</p>;
  return <RunsPanel key={user.username} />;
}
