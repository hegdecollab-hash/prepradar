export function SiteFooter() {
  return (
    <footer className="border-border/70 mt-auto border-t py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center">
        <p>
          A product by{" "}
          <a
            href="https://sai11.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            Society for AI
          </a>{" "}
          initiative
        </p>
      </div>
    </footer>
  );
}
