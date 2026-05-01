"use client";

import { startTransition, useState } from "react";
import { signOut } from "next-auth/react";

export function AdminSignOutButton({ callbackUrl = "/admin/login" }: { callbackUrl?: string }) {
  const [isPending, setIsPending] = useState(false);

  function handleClick() {
    setIsPending(true);
    startTransition(async () => {
      await signOut({ callbackUrl });
      setIsPending(false);
    });
  }

  return (
    <button type="button" onClick={handleClick} className="btn-secondary" disabled={isPending}>
      {isPending ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}