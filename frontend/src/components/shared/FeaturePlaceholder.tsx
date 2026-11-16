import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export function FeaturePlaceholder({ title, description }: { title: string; description: string }) {
  const { user, loading, error } = useAuth();
  if (loading) return <p role="status">Loading…</p>;
  if (error) return <p role="alert">{error}</p>;
  if (!user) return <p><Link href="/login">Sign in</Link> to view charts.</p>;
  return <section className="card"><h1>{title}</h1><p>{description}</p></section>;
}
