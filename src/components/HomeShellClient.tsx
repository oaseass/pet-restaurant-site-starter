"use client";

import { useEffect } from "react";

/**
 * Locks body scroll on desktop so only the center feed scrolls.
 * Cleans up on unmount (route change).
 */
export function HomeShellClient() {
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      document.documentElement.style.overflowY = "hidden";
    }
    return () => {
      document.documentElement.style.overflowY = "";
    };
  }, []);

  return null;
}
