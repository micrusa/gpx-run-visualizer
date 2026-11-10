import Head from "next/head";
import { useRouter } from "next/router";
import { RunDetailView } from "@/components/runs/RunDetailView";

export default function RunPage() {
  const router = useRouter();
  const id = typeof router.query.runId === "string" ? router.query.runId : null;
  return <>
    <Head><title>Run · GPX Run Visualizer</title></Head>
    {router.isReady && id ? <RunDetailView key={id} runId={id} /> : <p role="status">Loading run…</p>}
  </>;
}
