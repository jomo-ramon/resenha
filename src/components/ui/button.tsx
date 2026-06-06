import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "xl";

type CommonProps = {
  variant?: Variant | undefined;
  size?: Size | undefined;
  fullWidth?: boolean | undefined;
  leadingIcon?: ReactNode | undefined;
  trailingIcon?: ReactNode | undefined;
};

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary:
    "bg-[color:var(--color-brand)] text-white shadow-[var(--shadow-brand)] hover:bg-[color:var(--color-brand-strong)] focus-visible:ring-[color:var(--color-brand)]",
  secondary:
    "bg-[color:var(--color-ink)] text-[color:var(--color-surface)] hover:opacity-90 focus-visible:ring-[color:var(--color-ink)]",
  outline:
    "border border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-raised)] text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-muted)] focus-visible:ring-[color:var(--color-ink)]",
  ghost:
    "text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)] hover:bg-[color:var(--color-surface-muted)] focus-visible:ring-[color:var(--color-ink)]",
  danger:
    "bg-[color:var(--color-danger)] text-white hover:opacity-90 focus-visible:ring-[color:var(--color-danger)]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
  xl: "h-14 px-7 text-base",
};

function classes({ variant = "primary", size = "md", fullWidth }: CommonProps): string {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & CommonProps;

export function Button({
  variant,
  size,
  fullWidth,
  leadingIcon,
  trailingIcon,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={rest.type ?? "button"}
      {...rest}
      className={cn(classes({ variant, size, fullWidth }), className)}
    >
      {leadingIcon}
      <span>{children}</span>
      {trailingIcon}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & CommonProps;

export function ButtonLink({
  variant,
  size,
  fullWidth,
  leadingIcon,
  trailingIcon,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link {...rest} className={cn(classes({ variant, size, fullWidth }), className)}>
      {leadingIcon}
      <span>{children}</span>
      {trailingIcon}
    </Link>
  );
}
