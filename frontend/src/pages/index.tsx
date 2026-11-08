import Head from "next/head";
import { HomeContent } from "@/components/home/HomeContent";

export default function Home() {
  return <>
    <Head>
      <title>GPX Run Visualizer</title>
      <meta name="description" content="Explore running data and performance over time." />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
    <HomeContent />
  </>;
}
