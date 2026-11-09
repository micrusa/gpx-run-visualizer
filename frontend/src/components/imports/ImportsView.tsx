import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { ImportsPanel } from "@/components/imports/ImportsPanel";

export function ImportsView() {
  const { user, loading, error } = useAuth();
  if (loading) return <p role="status">Loading…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!user) return <p><Link href="/login">Sign in</Link> to import your runs.</p>;
  return <ImportsPanel key={user.username} />;
}
