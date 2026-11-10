import { type Run } from "@/lib/runService";

function clock(seconds: number) {
  const rounded = Math.round(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}

function startDate(value: string) {
  const date = new Date(value);
  const day = date.getDate();
  const suffix = day % 100 >= 11 && day % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[day % 10] ?? "th");
  const month = date.toLocaleString("en-GB", { month: "short" });
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${day}${suffix} ${month} ${date.getFullYear()} ${hour}:${minute}`;
}

export function RunsTable({ runs }: { runs: Run[] }) {
  return <div className="runs-table-scroll">
    <table className="runs-table">
      <caption className="sr-only">Your runs, newest first</caption>
      <thead><tr>
        <th scope="col">Start date</th><th scope="col">Distance</th>
        <th scope="col">Elapsed time</th><th scope="col">Elapsed pace</th>
        <th scope="col">Elevation gain</th><th scope="col">Avg. heart rate</th>
      </tr></thead>
      <tbody>{runs.map(run => <tr key={run.id}>
        <td>{run.startedAt ? <time dateTime={run.startedAt}>{startDate(run.startedAt)}</time> : "—"}</td>
        <td>{(run.distanceMeters / 1000).toFixed(2)} km</td>
        <td>{run.durationSeconds == null ? "—" : clock(run.durationSeconds)}</td>
        <td>{run.averagePaceSecondsPerKm == null ? "—" : `${clock(run.averagePaceSecondsPerKm)} /km`}</td>
        <td>{run.elevationGainMeters == null ? "—" : `${Math.round(run.elevationGainMeters)} m`}</td>
        <td>{run.averageHeartRate == null ? "—" : `${Math.round(run.averageHeartRate)} bpm`}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}
