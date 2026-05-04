"use client";

import { useState } from "react";
import type { ButtonHTMLAttributes } from "react";
import { useRouteProgress } from "@/components/RouteProgress";

type PendingSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel: string;
};

export function PendingSubmitButton({ children, pendingLabel, onClick, style, disabled, ...props }: PendingSubmitButtonProps) {
  const [pending, setPending] = useState(false);
  const { start } = useRouteProgress();

  return (
    <button
      {...props}
      disabled={disabled || pending}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        start(pendingLabel);
        window.setTimeout(() => setPending(true), 0);
      }}
      style={{ ...style, cursor: pending ? "wait" : style?.cursor, opacity: pending ? 0.72 : style?.opacity }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}