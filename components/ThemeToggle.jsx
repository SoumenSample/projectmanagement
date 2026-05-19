"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  const handleThemeToggle = React.useCallback(
    (event) => {
      const newMode = resolvedTheme === "dark" ? "light" : "dark";
      const root = document.documentElement;

      if (!document.startViewTransition) {
        setTheme(newMode);
        return;
      }

      if (event) {
        root.style.setProperty("--x", `${event.clientX}px`);
        root.style.setProperty("--y", `${event.clientY}px`);
      }

      document.startViewTransition(() => {
        setTheme(newMode);
      });
    },
    [resolvedTheme, setTheme]
  );

  return (
    <Button
      variant="secondary"
      size="icon-sm"
      className="group/toggle"
      onClick={handleThemeToggle}
    >
      <Icons.brightness className="size-4" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
