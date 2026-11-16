import Link from "next/link";
import { useEffect, useState } from "react";
import { listRuns, getRunErrorMessage, type RunPage } from "@/lib/runService";
import { RunsTable } from "@/components/runs/RunsTable";

export function RunsPanel() {
  const [result, setResult] = useState<RunPage | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    listRuns(page).then(result => { if (active) setResult(result); })
      .catch(error => { if (active) setError(getRunErrorMessage(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, attempt]);
  return <>
    <h1>Runs</h1>
    {loading ? <p role="status">Loading runs…</p>
      : error ? <p role="alert">{error} <button onClick={() => setAttempt(attempt + 1)}>Retry</button></p>
      : !result?.totalElements ? <p>No runs yet. <Link href="/imports">Import GPX files</Link></p>
      : <>
        <RunsTable runs={result.content} />
        <nav className="run-pagination" aria-label="Run pages">
          <button disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
          <span aria-live="polite">Page {result.page + 1} of {result.totalPages} · {result.totalElements} runs</span>
          <button disabled={page >= result.totalPages - 1} onClick={() => setPage(page + 1)}>Next</button>
        </nav>
      </>}
  </>;
}
