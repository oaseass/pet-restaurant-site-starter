"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export function AdminLoginForm({ callbackUrl, suggestedEmail }: { callbackUrl: string; suggestedEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(suggestedEmail ?? "");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const safeCallbackUrl = encodeURI(callbackUrl);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsPending(true);

    startTransition(async () => {
      const result = await signIn("admin-credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: safeCallbackUrl,
      });

      setIsPending(false);

      if (!result || result.error) {
        setErrorMessage("로그인 정보가 맞지 않거나 관리자 권한이 없습니다.");
        return;
      }

      router.push(result.url ?? safeCallbackUrl);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <label className="block text-sm font-black text-[#4b423c]">
        관리자 이메일
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="input mt-2 min-h-0 rounded-[1.2rem] py-4"
          placeholder="admin@daengnyang.local"
          required
          autoComplete="email"
        />
      </label>
      <label className="block text-sm font-black text-[#4b423c]">
        비밀번호
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="input mt-2 min-h-0 rounded-[1.2rem] py-4"
          placeholder="운영자가 설정한 관리자 비밀번호"
          required
          autoComplete="current-password"
        />
      </label>
      {errorMessage ? <p className="rounded-[1.2rem] border border-[rgba(177,63,63,0.16)] bg-[#fff4f1] px-4 py-3 text-sm font-semibold text-[#9d4639]">{errorMessage}</p> : null}
      <button type="submit" className="btn-primary w-full" disabled={isPending}>{isPending ? "로그인 중..." : "관리자 로그인"}</button>
    </form>
  );
}