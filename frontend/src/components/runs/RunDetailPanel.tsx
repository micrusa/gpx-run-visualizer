import Link from "next/link";
import { useEffect, useState } from "react";
import { getRun, getRunErrorMessage, type RunDetail } from "@/lib/runService";
import { RunExplorer } from "@/components/runs/RunExplorer";

export function RunDetailPanel({ runId }: { runId: string }) {
  const [run, setRun] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    getRun(runId).then(run => { if (active) setRun(run); })
      .catch(error => { if (active) setError(getRunErrorMessage(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [runId, attempt]);
  return <>
    <Link href="/runs">← All runs</Link>
    {loading ? <p role="status">Loading run…</p>
      : error ? <p role="alert">{error} <button onClick={() => setAttempt(attempt + 1)}>Retry</button></p>
      : run && <RunExplorer run={run} />}
  </>;
}
