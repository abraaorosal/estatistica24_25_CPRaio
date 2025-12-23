import { cn } from "@/lib/utils";

export function Separator({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-px w-full bg-gradient-to-r from-transparent via-ink/15 to-transparent", className)}
    />
  );
}
