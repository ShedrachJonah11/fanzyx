"use client";

import { useEffect, useState } from "react";
import { Toaster } from "sonner";

type ThemeMode = "light" | "dark";

function readTheme(): ThemeMode {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

export function AppToaster() {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    setTheme(readTheme());
    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <Toaster
      position="bottom-right"
      theme={theme}
      offset={20}
      gap={10}
      closeButton
      duration={3500}
      visibleToasts={4}
    />
  );
}
