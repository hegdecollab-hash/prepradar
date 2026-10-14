import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPage } from "@/components/results/search-page";

export const metadata: Metadata = { title: "Results", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10">Loading…</div>}>
      <SearchPage />
    </Suspense>
  );
}
