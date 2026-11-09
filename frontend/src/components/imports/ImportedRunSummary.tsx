import { type ImportedRun } from "@/lib/importService";

function clock(seconds: number | null) {
  if (seconds == null) return "—";
  const rounded = Math.round(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}

export function ImportedRunSummary({ run }: { run: ImportedRun }) {
  const summary = run.summary;
  return <section>
    <h3>{run.name}</h3>
    <dl className="run-summary">
      <div><dt>Distance</dt><dd>{(summary.distanceMeters / 1000).toFixed(2)} km</dd></div>
      <div><dt>Elapsed time</dt><dd>{clock(summary.durationSeconds)}</dd></div>
      <div><dt>Elapsed pace</dt><dd>{clock(summary.averagePaceSecondsPerKm)} /km</dd></div>
      <div><dt>Elevation gain</dt><dd>{summary.elevationGainMeters == null ? "—" : `${Math.round(summary.elevationGainMeters)} m`}</dd></div>
      <div><dt>Avg. heart rate</dt><dd>{summary.averageHeartRate == null ? "—" : `${Math.round(summary.averageHeartRate)} bpm`}</dd></div>
      <div><dt>Samples</dt><dd>{summary.pointCount.toLocaleString()}</dd></div>
    </dl>
  </section>;
}
