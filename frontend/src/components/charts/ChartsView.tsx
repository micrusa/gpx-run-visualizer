import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { ChartsPanel } from "@/components/charts/ChartsPanel";

export function ChartsView() {
  const { user, loading, error } = useAuth();
  if (loading) return <p role="status">Loading…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!user) return <p><Link href="/login">Sign in</Link> to view your charts.</p>;
  return <ChartsPanel key={user.username} />;
}
