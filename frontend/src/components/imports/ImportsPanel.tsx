import { useEffect, useState } from "react";
import { recentImports, getImportErrorMessage, type GpxImport } from "@/lib/importService";
import { ImportUploadForm } from "@/components/imports/ImportUploadForm";
import { ImportHistory } from "@/components/imports/ImportHistory";

export function ImportsPanel() {
  const [history, setHistory] = useState<GpxImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    recentImports().then(rows => { if (active) setHistory(rows); })
      .catch(error => { if (active) setError(getImportErrorMessage(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  return <>
    <h1>Imports</h1>
    <ImportUploadForm disabled={loading} onImported={rows => {
      setError("");
      setHistory(previous => [...rows.toReversed(), ...previous].slice(0, 50));
    }} />
    <h2>Recent imports</h2>
    {loading ? <p role="status">Loading imports…</p> : error
      ? <p role="alert">{error} <button onClick={() => setAttempt(attempt + 1)}>Retry</button></p>
      : <ImportHistory imports={history} />}
  </>;
}
