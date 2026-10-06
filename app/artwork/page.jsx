import { Suspense } from "react";
import ArtworkClient from "./ArtworkClient";

function Loading() {
  return <main className="empty-state"><div><p className="kicker">Pichart</p><h1>در حال آماده‌سازی...</h1></div></main>;
}

export default function ArtworkPage() {
  return <Suspense fallback={<Loading />}><ArtworkClient /></Suspense>;
}
