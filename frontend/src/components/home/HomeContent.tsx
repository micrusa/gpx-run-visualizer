import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export function HomeContent() {
  const { user, loading, error, refresh } = useAuth();
  return <>
    <h1>GPX Run Visualizer</h1>
    {loading ? <p role="status">Loading…</p> : error ? <p role="alert">{error} <button onClick={() => void refresh()}>Retry</button></p>
      : user ? <div className="cards">
        <Link className="card" href="/imports"><h2>Imports</h2></Link>
        <Link className="card" href="/charts"><h2>Charts</h2></Link>
        <Link className="card" href="/runs"><h2>Run view</h2></Link>
      </div> : <p><Link className="button" href="/login">Sign in or register</Link></p>}
  </>;
}
