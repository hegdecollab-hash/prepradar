import { getCompanyLogo } from "@/lib/company-logos";
import { cn } from "@/lib/utils";

/** Decorative logo tile (aria-hidden). The company name must always be rendered as text next to it. */
export function CompanyLogo({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const logo = getCompanyLogo(name);
  const box = size === "sm" ? "size-5 rounded-[5px]" : "size-8 rounded-lg";
  const icon = size === "sm" ? "size-3" : "size-[18px]";
  return (
    <span
      aria-hidden="true"
      className={cn("bg-card border-border/80 inline-flex shrink-0 items-center justify-center border", box, className)}
    >
      {logo ? (
        <svg viewBox="0 0 24 24" className={icon} fill={logo.color} focusable="false">
          <path d={logo.path} />
        </svg>
      ) : (
        <span
          className={cn(
            "font-display text-primary leading-none font-bold",
            size === "sm" ? "text-[0.6875rem]" : "text-[0.9375rem]",
          )}
        >
          {(name.trim().match(/[A-Za-z0-9]/)?.[0] ?? "?").toUpperCase()}
        </span>
      )}
    </span>
  );
}
