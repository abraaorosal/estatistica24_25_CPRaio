import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "neutral",
  className
}: {
  children: ReactNode;
  tone?: "positive" | "negative" | "neutral";
  className?: string;
}) {
  const tones = {
    positive: "bg-emerald-100 text-emerald-700",
    negative: "bg-rose-100 text-rose-700",
    neutral: "bg-slate-100 text-slate-700"
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
