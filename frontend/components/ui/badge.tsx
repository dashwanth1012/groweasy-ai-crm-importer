import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "default" | "success" | "warning" | "muted";

const tones: Record<BadgeTone, string> = {
  default: "bg-foreground text-background",
  success: "bg-accent text-accent-foreground",
  warning: "bg-[#ffe5dc] text-[#7a270f] dark:bg-[#40180d] dark:text-[#ffd5c8]",
  muted: "bg-muted text-muted-foreground"
};

export function Badge({ className, tone = "default", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-bold leading-none", tones[tone], className)}
      {...props}
    />
  );
}

