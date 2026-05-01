import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LostPetCard } from "@/components/LostPetCard";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function LostPetsPage() {
  const items = await prisma.lostPet.findMany({
    where: { status: { in: ["APPROVED", "FOUND"] } },
    orderBy: { createdAt: "desc" },
    take: 24,
  });

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10 max-w-3xl">
          <p className="eyebrow">Lost Pets</p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">댕냥이 찾아요</h1>
          <p className="mt-4 text-sm leading-8 text-[#655a53] sm:text-base">실종 반려동물 게시글을 내부 DB에 저장하고 제보를 이어받습니다. 외부 원본 사이트를 호출하지 않습니다.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/lost-pets/new" className="btn-primary">실종 글 올리기</Link>
            <Link href="/report" className="btn-secondary">가격·정보 제보</Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {items.length > 0 ? items.map((item) => <LostPetCard key={item.id} item={item} />) : <EmptyState title="공개 중인 실종 제보가 없습니다." description="새 글을 등록하면 내부 검수 후 공개됩니다." character="cat-peeking" />}
      </section>
    </main>
  );
}