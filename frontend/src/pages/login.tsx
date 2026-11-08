import Head from "next/head";
import { LoginContent } from "@/components/auth/LoginContent";

export default function Login() {
  return <>
    <Head><title>Sign in · GPX Run Visualizer</title></Head>
    <LoginContent />
  </>;
}
