import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="border-border/70 mt-auto border-t py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center">
        <p className="inline-flex flex-wrap items-center justify-center gap-x-1">
          <span>A product by</span>
          <a
            href="https://sai11.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex items-center gap-1.5 underline-offset-4 hover:underline"
          >
            <Image
              src="/sai-logo.svg"
              alt="Society for AI"
              width={20}
              height={20}
              className="h-5 w-5 rounded-sm"
            />
            Society for AI
          </a>
          <span>initiative</span>
        </p>
      </div>
    </footer>
  );
}
