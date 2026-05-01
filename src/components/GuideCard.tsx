import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CharacterAsset } from "@/lib/platform-content";

export function GuideCard({
  title,
  description,
  href,
  character: _character,
}: {
  title: string;
  description: string;
  href: string;
  character: CharacterAsset;
}) {
  return (
    <Link href={href} className="card group block rounded-[1rem] p-5 transition hover:border-[rgba(31,107,91,0.2)] hover:bg-[#fcfbf9]">
      <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">생활 가이드</p>
      <h3 className="mt-3 text-lg font-black tracking-tight">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{description}</p>
      <div className="mt-4 flex items-center gap-2 text-sm font-black text-[var(--brand)]">
        자세히 보기 <ArrowRight size={16} />
      </div>
    </Link>
  );
}