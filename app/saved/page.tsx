import type { Metadata } from "next";
import { SavedPage } from "@/components/saved/saved-page";

export const metadata: Metadata = { title: "Saved questions", robots: { index: false, follow: false } };

export default function Page() {
  return <SavedPage />;
}
