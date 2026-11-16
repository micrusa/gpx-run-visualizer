import { useState, type FormEvent } from "react";
import { uploadGpx, getImportErrorMessage, type GpxImport } from "@/lib/importService";

type Props = { disabled: boolean; onImported: (rows: GpxImport[]) => void };

export function ImportUploadForm({ disabled, onImported }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true); setError(""); setMessage("");
    try {
      const results = await uploadGpx(files);
      onImported(results);
      const completed = results.filter(row => row.status === "COMPLETED").length;
      setMessage(`${completed} imported, ${results.length - completed} failed.`);
      setFiles([]); form.reset();
    } catch (error) { setError(getImportErrorMessage(error)); }
    finally { setBusy(false); }
  }
  return <section className="card">
    <form onSubmit={submit}>
      <label htmlFor="gpx-files">GPX files</label>
      <input id="gpx-files" type="file" accept=".gpx" multiple required disabled={busy || disabled}
        aria-describedby="upload-help" onChange={event => setFiles(Array.from(event.target.files ?? []))} />
      <small id="upload-help">One run per track</small>
      <button type="submit" disabled={busy || disabled || !files.length}>
        {busy ? "Importing…" : `Import${files.length ? ` ${files.length} file${files.length === 1 ? "" : "s"}` : " files"}`}
      </button>
    </form>
    {error && <p role="alert" className="error">{error}</p>}
    {message && <p role="status">{message}</p>}
  </section>;
}
