import type { Metadata } from "next";
import { notFound } from "next/navigation";

const POLICY_CONTENT = {
  privacy: {
    title: "개인정보처리방침",
    sections: [
      { title: "수집 항목", body: "실종 제보, 업체 요청, 가격 제보 과정에서 입력한 연락 수단과 메모는 필요한 범위에서만 저장합니다." },
      { title: "보관 방식", body: "사용자 연락 수단은 마스킹하여 저장하고, 검수 및 운영 목적으로만 사용합니다." },
    ],
  },
  terms: {
    title: "이용약관",
    sections: [
      { title: "서비스 성격", body: "댕냥지도는 반려생활 정보를 탐색하기 위한 내부 DB 기반 안내 서비스입니다." },
      { title: "책임 범위", body: "최종 이용 조건, 가격, 법적 효력은 공식 기관과 사업자 안내를 다시 확인해야 합니다." },
    ],
  },
  reports: {
    title: "제보 운영정책",
    sections: [
      { title: "검수 원칙", body: "사용자 제보와 업체 등록 정보는 공개 전 검수 단계를 거칩니다." },
      { title: "비공개 처리", body: "허위, 중복, 위험성이 높은 정보는 비공개 또는 반려될 수 있습니다." },
    ],
  },
  ads: {
    title: "광고·제휴 고지",
    sections: [
      { title: "광고 위치", body: "광고 슬롯은 콘텐츠와 구분되도록 명시하며 광고 주변에는 캐릭터를 두지 않습니다." },
      { title: "제휴 기준", body: "제휴가 있더라도 공식 데이터와 사용자 제보 구분 표시는 유지합니다." },
    ],
  },
  medical: {
    title: "의료정보 면책",
    sections: [
      { title: "참고용 정보", body: "예방접종, 수술, 처방식 관련 정보는 일반 참고용이며 진료 지시가 아닙니다." },
      { title: "전문가 상담", body: "개별 질환, 증상, 처치 계획은 반드시 수의사 상담이 우선입니다." },
    ],
  },
  legal: {
    title: "법률정보 기준일",
    sections: [
      { title: "기준일", body: "동물등록, 과태료, 운송 규정은 기준일 이후 바뀔 수 있으므로 공식 공지를 다시 확인해야 합니다." },
      { title: "지역 차이", body: "지자체와 사업자별 세부 운영 차이가 있을 수 있습니다." },
    ],
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = POLICY_CONTENT[slug as keyof typeof POLICY_CONTENT];
  return { title: article ? `${article.title} | 댕냥지도` : "정책을 찾을 수 없습니다." };
}

export default async function PolicyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = POLICY_CONTENT[slug as keyof typeof POLICY_CONTENT];
  if (!article) notFound();

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <p className="eyebrow">Policy</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">{article.title}</h1>
      </section>

      <section className="mt-6 space-y-4">
        {article.sections.map((section) => (
          <article key={section.title} className="card rounded-[2rem] p-6">
            <h2 className="text-xl font-black">{section.title}</h2>
            <p className="mt-4 text-sm leading-8 text-[#665950]">{section.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}