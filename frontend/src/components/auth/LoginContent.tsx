import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/components/auth/AuthProvider";

export function LoginContent() {
  const { user, loading } = useAuth();
  if (loading) return <p role="status">Loading…</p>;
  if (user) return <p>You are signed in. <Link href="/">Go home</Link>.</p>;
  return <AuthForm />;
}
