import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Table({
  headers,
  rows,
  className
}: {
  headers: string[];
  rows: Array<Array<ReactNode>>;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-slate">
            {headers.map((header) => (
              <th key={header} className="pb-3 pr-4 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={`row-${index}`}
              className="border-t border-ink/10 text-ink"
            >
              {row.map((cell, cellIndex) => (
                <td key={`cell-${cellIndex}`} className="py-3 pr-4">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
