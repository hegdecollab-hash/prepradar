import { MessageCircle } from "lucide-react";
import { WHATSAPP_URL } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="border-border/70 mt-auto border-t py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center">
        <p>
          A product by Society for AI initiative
        </p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground inline-flex min-h-11 items-center gap-2 rounded-lg px-3"
        >
          <MessageCircle className="size-4" aria-hidden />
          Message us on WhatsApp
        </a>
      </div>
    </footer>
  );
}
