import Link from "next/link";
import { MapPin, Clock3 } from "lucide-react";
import type { LostPet } from "@prisma/client";
import { SourceBadge } from "@/components/SourceBadge";
import { CharacterImage } from "@/components/CharacterImage";

export function LostPetCard({ item }: { item: LostPet }) {
  const photoUrls = Array.isArray(item.photoUrls) ? (item.photoUrls as string[]) : [];

  return (
    <Link href={`/lost-pets/${item.id}`} className="card block rounded-[1rem] p-5 transition hover:border-[rgba(31,107,91,0.2)] hover:bg-[#fcfbf9]">
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
    </Link>
  );
}