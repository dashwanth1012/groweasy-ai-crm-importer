import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "focus-ring h-11 w-full rounded-[8px] border border-border bg-card px-4 text-sm outline-none placeholder:text-muted-foreground",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

