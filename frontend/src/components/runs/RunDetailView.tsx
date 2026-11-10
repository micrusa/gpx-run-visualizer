import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { RunDetailPanel } from "@/components/runs/RunDetailPanel";

export function RunDetailView({ runId }: { runId: string }) {
  const { user, loading, error } = useAuth();
  if (loading) return <p role="status">Loading…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!user) return <p><Link href="/login">Sign in</Link> to view this run.</p>;
  return <RunDetailPanel key={`${user.username}:${runId}`} runId={runId} />;
}
