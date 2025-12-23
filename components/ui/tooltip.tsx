"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Tooltip({
  content,
  children,
  className
}: {
  content: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
      aria-label={content}
    >
      {children}
      {open ? (
        <span
          role="tooltip"
          className={cn(
            "absolute left-1/2 top-full z-10 mt-2 w-48 -translate-x-1/2 rounded-2xl bg-ink px-3 py-2 text-xs text-white shadow-lg",
            className
          )}
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
