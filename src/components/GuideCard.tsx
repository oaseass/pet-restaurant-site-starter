import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CharacterImage } from "@/components/CharacterImage";
import type { CharacterAsset } from "@/lib/platform-content";

export function GuideCard({
  title,
  description,
  href,
  character,
}: {
  title: string;
  description: string;
  href: string;
  character: CharacterAsset;
}) {
  return (
    <Link href={href} className="card group block rounded-[2rem] p-5 transition hover:-translate-y-1">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-black tracking-tight">{title}</h3>
          <p className="mt-3 text-sm leading-7 text-[#665950]">{description}</p>
        </div>
        <div className="h-16 w-16 shrink-0 rounded-full bg-[radial-gradient(circle_at_35%_35%,rgba(255,184,107,0.24),rgba(189,237,220,0.2),transparent_72%)] p-2">
          <CharacterImage asset={character} className="h-full w-full" imageClassName="object-contain" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm font-black text-[var(--brand)]">
        자세히 보기 <ArrowRight size={16} />
      </div>
    </Link>
  );
}