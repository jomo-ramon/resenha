import { cn } from "@/lib/utils/cn";

/**
 * resenha wordmark — soccer-ball glyph + lowercase wordmark.
 *
 * The ball is a tiny inline SVG (no external font) so it scales cleanly
 * and inherits color via `currentColor`.
 */
export function Logo({
  size = "md",
  variant = "default",
  className,
}: {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "compact" | "wordmark";
  className?: string;
}) {
  const dims = {
    sm: { ball: 18, text: "text-base", gap: "gap-1.5" },
    md: { ball: 22, text: "text-xl", gap: "gap-2" },
    lg: { ball: 36, text: "text-3xl", gap: "gap-2.5" },
  }[size];

  if (variant === "wordmark") {
    return (
      <span className={cn("font-extrabold tracking-tight lowercase", dims.text, className)}>
        resenha
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center font-extrabold tracking-tight lowercase",
        dims.gap,
        dims.text,
        className,
      )}
    >
      <BallGlyph size={dims.ball} />
      {variant !== "compact" && <span>resenha</span>}
    </span>
  );
}

export function BallGlyph({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <title>resenha</title>
      <circle cx="16" cy="16" r="14" fill="currentColor" />
      <path
        d="M16 6 L20.7 9.4 L18.9 14.9 L13.1 14.9 L11.3 9.4 Z"
        fill="white"
        stroke="white"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      <path d="M16 6 L16 2.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M20.7 9.4 L24.5 7.8" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11.3 9.4 L7.5 7.8" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M18.9 14.9 L22.5 19.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M13.1 14.9 L9.5 19.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
