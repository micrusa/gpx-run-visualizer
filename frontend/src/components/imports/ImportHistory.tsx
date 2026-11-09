import { type GpxImport } from "@/lib/importService";
import { ImportedRunSummary } from "@/components/imports/ImportedRunSummary";

export function ImportHistory({ imports }: { imports: GpxImport[] }) {
  if (!imports.length) return <p>No imports yet.</p>;
  return <ul className="import-history">
    {imports.map(row => <li className="card" key={row.id}>
      <div className="import-heading"><strong>{row.filename}</strong>
        <span>{row.status === "COMPLETED" ? "Imported" : "Failed"}</span></div>
      <small><time dateTime={row.uploadedAt}>{new Date(row.uploadedAt).toLocaleString()}</time></small>
      {row.error && <p className="error">{row.error}</p>}
      {row.runs.map(run => <ImportedRunSummary key={run.id} run={run} />)}
    </li>)}
  </ul>;
}
