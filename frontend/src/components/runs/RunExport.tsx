import { useMemo, useState } from "react";
import { RunSettingsDialog } from "@/components/runs/RunSettingsDialog";
import type { graphValues } from "@/components/runs/chartData";
import { downloadRunGeoCsv, exportPointIndices, GEO_CSV_COLUMNS } from "@/lib/runExportService";
import type { RunSelection } from "@/lib/runSelectionService";
import type { RunPoint } from "@/lib/runService";

type Props = {
  runId: number;
  points: RunPoint[];
  values: ReturnType<typeof graphValues>;
  excluded: boolean[];
  selection: RunSelection | null;
};

export function RunExport({ runId, points, values, excluded, selection }: Props) {
  const [open, setOpen] = useState(false);
  const indices = useMemo(() => open ? exportPointIndices(excluded, selection) : [], [excluded, open, selection]);
  const count = indices.length;
  return <>
    <button type="button" aria-haspopup="dialog" aria-controls="run-export-dialog" onClick={() => setOpen(true)}>Export</button>
    <RunSettingsDialog id="run-export-dialog" title="Export GeoCSV" open={open} onClose={() => setOpen(false)}>
      <p><strong>{count.toLocaleString()} {count === 1 ? "point" : "points"}</strong> from {selection ? "the selected range" : "the full run"}.</p>
      <p className="run-settings-description">
        The CSV includes all metrics with selected filtering and processing settings applied. Missing values are left blank.
      </p>
      <table className="run-export-columns">
        <caption>GeoCSV columns</caption>
        <thead><tr><th scope="col">Column</th><th scope="col">Contents</th></tr></thead>
        <tbody>{GEO_CSV_COLUMNS.map(column => <tr key={column.name}>
          <th scope="row"><code>{column.name}</code></th><td>{column.description}</td>
        </tr>)}</tbody>
      </table>
      <button type="button" disabled={count === 0} onClick={() => {
        downloadRunGeoCsv(runId, points, values, indices);
        setOpen(false);
      }}>Download GeoCSV</button>
    </RunSettingsDialog>
  </>;
}
