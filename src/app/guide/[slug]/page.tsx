import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { CharacterImage } from "@/components/CharacterImage";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { MedicalDisclaimer } from "@/components/MedicalDisclaimer";
import { OfficialDataNotice } from "@/components/OfficialDataNotice";
import { PriceNote } from "@/components/PriceNote";
import { SourceBadge } from "@/components/SourceBadge";
import { absoluteUrl } from "@/lib/brand";
import { GUIDE_DOC_MAP, QUICK_CATEGORIES } from "@/lib/platform-content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = GUIDE_DOC_MAP[slug];
  if (!guide) {
    return { title: "가이드를 찾을 수 없습니다." };
  }

  return {
    title: `${guide.title} | 댕냥지도`,
    description: guide.summary,
    alternates: { canonical: absoluteUrl(`/guide/${guide.slug}`) },
  };
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = GUIDE_DOC_MAP[slug];
  if (!guide) notFound();

  const character = QUICK_CATEGORIES.find((item) => item.category === guide.category)?.character ?? "cat-peeking";

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="absolute right-3 top-3 h-24 w-24 opacity-95 sm:h-28 sm:w-28">
          <CharacterImage asset={character} className="h-full w-full" imageClassName="object-contain" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap gap-2">
            <SourceBadge label="관리자 검수형 가이드" tone="manual" />
            <SourceBadge label={`기준일 ${guide.reviewedAt}`} tone="official" />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">{guide.title}</h1>
          <p className="mt-4 text-sm leading-8 text-[#655a53] sm:text-base">{guide.summary}</p>
          <p className="mt-4 text-sm leading-7 text-[#665950]">{guide.sourceNote}</p>
        </div>
      </section>

      <section className="mt-6 space-y-4">
        {guide.sections.map((section) => (
          <article key={section.title} className="card rounded-[1.8rem] p-6">
            <h2 className="text-2xl font-black tracking-tight">{section.title}</h2>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[#5f5550]">
              {section.bullets.map((bullet) => (
                <li key={bullet}>· {bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <AdSlot label={`${guide.title} 광고 영역`} />

      <div className="grid gap-4 lg:grid-cols-2">
        <OfficialDataNotice />
        {guide.medicalDisclaimer ? <MedicalDisclaimer /> : guide.legalDisclaimer ? <LegalDisclaimer /> : <PriceNote />}
      </div>
    </main>
  );
}