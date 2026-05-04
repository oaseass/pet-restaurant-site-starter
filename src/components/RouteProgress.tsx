"use client";

import { Suspense, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type RouteProgressContextValue = {
  start: (label?: string) => void;
  done: () => void;
};

const RouteProgressContext = createContext<RouteProgressContextValue>({
  start: () => {},
  done: () => {},
});

export function useRouteProgress() {
  return useContext(RouteProgressContext);
}

function RouteProgressResetter({ done }: { done: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    done();
  }, [done, pathname, searchParams]);

  return null;
}

export function RouteProgressProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState("이동 중...");
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    showTimerRef.current = null;
    fallbackTimerRef.current = null;
  }, []);

  const done = useCallback(() => {
    clearTimers();
    setVisible(false);
  }, [clearTimers]);

  const start = useCallback((nextLabel = "이동 중...") => {
    clearTimers();
    setLabel(nextLabel);
    showTimerRef.current = setTimeout(() => setVisible(true), 150);
    fallbackTimerRef.current = setTimeout(() => setVisible(false), 6500);
  }, [clearTimers]);

  useEffect(() => done, [done]);

  const value = useMemo(() => ({ start, done }), [done, start]);

  return (
    <RouteProgressContext.Provider value={value}>
      {children}
      <Suspense fallback={null}>
        <RouteProgressResetter done={done} />
      </Suspense>
      <div
        className={`pointer-events-none fixed inset-x-0 top-0 z-[80] transition-opacity duration-150 ${visible ? "opacity-100" : "opacity-0"}`}
        aria-hidden={!visible}
      >
        <div className="h-0.5 w-full overflow-hidden bg-[rgba(31,107,91,0.14)]">
          <div className="h-full w-1/2 animate-[route-progress_1.1s_ease-in-out_infinite] bg-[var(--brand)]" />
        </div>
        <div className="mx-auto mt-2 w-fit rounded-full border border-[var(--line)] bg-white/95 px-3 py-1 text-[11px] font-black text-[var(--brand)] shadow-[0_6px_18px_rgba(23,23,23,0.08)] md:hidden">
          {label}
        </div>
      </div>
    </RouteProgressContext.Provider>
  );
}