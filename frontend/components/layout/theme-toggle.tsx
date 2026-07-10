"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] text-foreground" aria-hidden="true">
        <Monitor className="h-4 w-4" />
      </span>
    );
  }

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <Button variant="ghost" size="icon" aria-label={`Switch to ${nextTheme} mode`} onClick={() => setTheme(nextTheme)}>
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
