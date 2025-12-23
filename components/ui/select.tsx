import { cn } from "@/lib/utils";

export function Select({
  label,
  value,
  onChange,
  options,
  className,
  ariaLabel
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-2 text-sm font-medium", className)}>
      {label ? <span className="text-slate">{label}</span> : null}
      <select
        aria-label={ariaLabel || label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-ink/10 bg-white/80 px-3 py-2 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
