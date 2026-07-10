import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-muted", className)} aria-label={`Progress ${safeValue}%`}>
      <div className="h-full rounded-full bg-foreground editorial-transition" style={{ width: `${safeValue}%` }} />
    </div>
  );
}

