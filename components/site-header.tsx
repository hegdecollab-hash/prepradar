import Link from "next/link";
import { Radar } from "lucide-react";
import { APP_NAME } from "@/lib/config";

export function SiteHeader() {
  return (
    <header className="border-border/70 bg-background/90 supports-[backdrop-filter]:bg-background/75 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex min-h-11 items-center gap-2 rounded-lg font-semibold">
          <Radar className="text-primary size-5" aria-hidden />
          {APP_NAME}
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          <Link
            href="/#how"
            className="text-muted-foreground hover:text-foreground hidden min-h-11 items-center rounded-lg px-3 sm:flex"
          >
            How it works
          </Link>
          <Link
            href="/saved"
            className="text-foreground hover:text-primary flex min-h-11 items-center rounded-lg px-3 font-semibold"
          >
            Saved
          </Link>
        </nav>
      </div>
    </header>
  );
}
