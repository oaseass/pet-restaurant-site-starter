import { MapPin, Clock3 } from "lucide-react";
import type { LostPet } from "@prisma/client";
import { SourceBadge } from "@/components/SourceBadge";
import { CharacterImage } from "@/components/CharacterImage";
import { SmartLink } from "@/components/SmartLink";

export function LostPetCard({ item }: { item: LostPet }) {
  const photoUrls = Array.isArray(item.photoUrls) ? (item.photoUrls as string[]) : [];

  return (
    <article className="card rounded-[1rem] p-5 transition hover:border-[rgba(31,107,91,0.2)] hover:bg-[#fcfbf9]">
      <SmartLink href={`/lost-pets/${item.id}`} className="block text-[var(--ink)] no-underline">
        <div className="flex items-start gap-4">
        <div className="h-20 w-20 shrink-0 rounded-2xl bg-[var(--accent-soft)] p-2">
          {photoUrls[0] ? (
            <img src={photoUrls[0]} alt="실종 반려동물 사진" className="h-full w-full rounded-xl object-cover" />
          ) : (
            <CharacterImage asset={item.animalType === "고양이" ? "cat-peeking" : "puppy-side-white"} className="h-full w-full" imageClassName="object-contain" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <SourceBadge label={item.status === "FOUND" ? "찾음 처리" : "실종 제보"} tone={item.status === "FOUND" ? "owner" : "user"} />
            {item.rewardAmount ? <SourceBadge label={`사례금 ${item.rewardAmount.toLocaleString("ko-KR")}원`} tone="manual" /> : null}
          </div>
          <h3 className="mt-3 text-lg font-black tracking-tight">{item.petName}</h3>
          <p className="mt-2 flex gap-2 text-sm leading-6 text-[var(--muted)]"><MapPin className="mt-0.5 shrink-0" size={16} /> {item.lostAddress}</p>
          <p className="mt-2 flex gap-2 text-sm leading-6 text-[var(--muted)]"><Clock3 className="mt-0.5 shrink-0" size={16} /> {new Date(item.lostAt).toLocaleDateString("ko-KR")}</p>
        </div>
      </div>
      </SmartLink>
      <div className="mt-4 grid gap-2 border-t border-[var(--line)] pt-3 text-xs font-black sm:grid-cols-2">
        <SmartLink href={`/lost-pets/${item.id}`} className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--brand)] px-4 text-white no-underline">
          자세히 보기
        </SmartLink>
        <SmartLink href={`/lost-pets/${item.id}#report`} className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--brand)] bg-white px-4 text-[var(--brand)] no-underline">
          목격 제보
        </SmartLink>
      </div>
    </article>
  );
}