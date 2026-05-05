import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideArticle } from "@/components/guide/GuideArticle";
import { absoluteUrl } from "@/lib/brand";
import { GUIDE_DOC_MAP } from "@/lib/guide-content";

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

  return <GuideArticle guide={guide} />;
}