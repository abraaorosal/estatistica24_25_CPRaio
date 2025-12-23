import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Button({
  children,
  onClick,
  variant = "primary",
  className,
  type = "button"
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline";
  className?: string;
  type?: "button" | "submit" | "reset";
}) {
  const base =
    "inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  const variants = {
    primary: "bg-primary text-ink shadow-soft",
    ghost: "bg-transparent text-ink hover:bg-white/60",
    outline: "border border-ink/20 text-ink bg-white/70"
  };
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(base, variants[variant], className)}
    >
      {children}
    </button>
  );
}
