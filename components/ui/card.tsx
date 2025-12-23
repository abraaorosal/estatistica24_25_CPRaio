import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl bg-white/90 shadow-card border border-white/60 p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  className
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-4", className)}>
      <h3 className="font-display text-lg text-ink">{title}</h3>
      {description ? (
        <p className="text-sm text-slate mt-1">{description}</p>
      ) : null}
    </div>
  );
}
