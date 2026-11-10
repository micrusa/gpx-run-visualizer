import Link from "next/link";
import { useRouter } from "next/router";
import { formatClock, formatStartDate } from "@/components/runs/format";
import { type Run } from "@/lib/runService";

export function RunsTable({ runs }: { runs: Run[] }) {
  const router = useRouter();
  return <div className="runs-table-scroll">
    <table className="runs-table">
      <caption className="sr-only">Your runs, newest first</caption>
      <thead><tr>
        <th scope="col">Start date</th><th scope="col">Distance</th>
        <th scope="col">Elapsed time</th><th scope="col">Elapsed pace</th>
        <th scope="col">Elevation gain</th><th scope="col">Avg. heart rate</th>
      </tr></thead>
      <tbody>{runs.map(run => <tr key={run.id} onClick={event => {
        if ((event.target as HTMLElement).closest("a")) return;
        void router.push(`/runs/${run.id}`);
      }}>
        <td><Link href={`/runs/${run.id}`} aria-label={run.startedAt ? `Open run from ${formatStartDate(run.startedAt)}` : "Open run"}>
          {run.startedAt ? <time dateTime={run.startedAt}>{formatStartDate(run.startedAt)}</time> : "—"}
        </Link></td>
        <td>{(run.distanceMeters / 1000).toFixed(2)} km</td>
        <td>{run.durationSeconds == null ? "—" : formatClock(run.durationSeconds)}</td>
        <td>{run.averagePaceSecondsPerKm == null ? "—" : `${formatClock(run.averagePaceSecondsPerKm)} /km`}</td>
        <td>{run.elevationGainMeters == null ? "—" : `${Math.round(run.elevationGainMeters)} m`}</td>
        <td>{run.averageHeartRate == null ? "—" : `${Math.round(run.averageHeartRate)} bpm`}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}
