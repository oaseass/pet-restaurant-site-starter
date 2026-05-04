import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { getPlaceDetailById } from "@/lib/place-detail";

export const metadata: Metadata = {
  title: "리뷰 남기기 | 댕냥지도",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type ReviewNewSearchParams = {
  targetType?: string;
  targetId?: string;
  submitted?: string;
  error?: string;
};

const RATING_OPTIONS = [5, 4, 3, 2, 1] as const;

const PET_TYPE_OPTIONS = [
  { value: "DOG", label: "강아지" },
  { value: "CAT", label: "고양이" },
  { value: "BOTH", label: "강아지·고양이" },
  { value: "OTHER", label: "기타 반려동물" },
] as const;

const PET_SIZE_OPTIONS = [
  { value: "SMALL", label: "소형" },
  { value: "MEDIUM", label: "중형" },
  { value: "LARGE", label: "대형" },
  { value: "UNKNOWN", label: "모름/해당 없음" },
] as const;

const ANSWER_OPTIONS = [
  { value: "UNKNOWN", label: "확인 필요" },
  { value: "YES", label: "예" },
  { value: "NO", label: "아니오" },
] as const;

async function resolveTarget(targetType: string, targetId: string) {
  if (targetType === "RESTAURANT") {
    const restaurant = await prisma.restaurant.findUnique({ where: { id: targetId } });
    if (!restaurant || restaurant.status !== "ACTIVE") return null;
    return {
      label: "반려동물 동반 식당",
      name: restaurant.name,
      meta: `${restaurant.sido}${restaurant.sigungu ? ` ${restaurant.sigungu}` : ""} · ${restaurant.businessType}`,
    };
  }

  if (targetType === "PLACE") {
    const place = await getPlaceDetailById(targetId);
    if (!place) return null;
    return {
      label: "반려동물 장소",
      name: place.name,
      meta: [place.sido, place.sigungu, place.category].filter(Boolean).join(" · "),
    };
  }

  return null;
}

export default async function ReviewNewPage({ searchParams }: { searchParams: Promise<ReviewNewSearchParams> }) {
  const params = await searchParams;
  const targetType = params.targetType === "RESTAURANT" || params.targetType === "PLACE" ? params.targetType : "";
  const targetId = String(params.targetId ?? "").trim();
  if (!targetType || !targetId) notFound();

  const target = await resolveTarget(targetType, targetId);
  if (!target) notFound();

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:py-10">
      <section className="section-shell p-6 sm:p-8">
        <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">댕냥지도 리뷰</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--ink)]">반려동물 동반 경험 리뷰 남기기</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          {target.label} <span className="font-black text-[var(--ink)]">{target.name}</span>에 반려동물과 함께 방문한 경험을 남겨 주세요.
        </p>
        <p className="mt-1 text-xs font-bold text-[var(--muted)]">{target.meta}</p>
        {params.submitted ? <p className="mt-4 rounded-lg bg-[var(--brand-soft)] px-4 py-3 text-sm font-black text-[var(--brand)]">리뷰가 접수되었습니다. 운영자 검수 후 상세 페이지에 반영됩니다.</p> : null}
        {params.error ? <p className="mt-4 rounded-lg bg-[#fff1e8] px-4 py-3 text-sm font-black text-[#b45309]">{params.error}</p> : null}
      </section>

      <form method="post" action="/api/reviews" className="mt-6 grid gap-4 rounded-[1rem] border border-[var(--line)] bg-white p-5 sm:grid-cols-2">
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />

        <SelectField name="ratingOverall" label="종합 별점" required>
          {RATING_OPTIONS.map((value) => <option key={value} value={value}>{value}점</option>)}
        </SelectField>
        <SelectField name="ratingPetFriendly" label="반려동물 동반 편의성" required>
          {RATING_OPTIONS.map((value) => <option key={value} value={value}>{value}점</option>)}
        </SelectField>
        <SelectField name="ratingCleanliness" label="청결도">
          <option value="">선택 안 함</option>
          {RATING_OPTIONS.map((value) => <option key={value} value={value}>{value}점</option>)}
        </SelectField>
        <SelectField name="ratingStaff" label="직원 친절도">
          <option value="">선택 안 함</option>
          {RATING_OPTIONS.map((value) => <option key={value} value={value}>{value}점</option>)}
        </SelectField>
        <SelectField name="ratingParking" label="주차 편의성">
          <option value="">선택 안 함</option>
          {RATING_OPTIONS.map((value) => <option key={value} value={value}>{value}점</option>)}
        </SelectField>
        <label className="space-y-2 text-sm font-bold text-[#4b423c]">방문일<input type="date" name="visitDate" required className="input rounded-[1rem]" /></label>

        <SelectField name="petType" label="반려동물 종류" required>
          {PET_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </SelectField>
        <SelectField name="petSize" label="반려동물 크기" required>
          {PET_SIZE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </SelectField>

        <SelectField name="indoorAllowed" label="실내 동반 가능 여부" required>
          {ANSWER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </SelectField>
        <SelectField name="outdoorAllowed" label="야외 동반 가능 여부" required>
          {ANSWER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </SelectField>
        <SelectField name="largeDogAllowed" label="대형견 가능 여부" required>
          {ANSWER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </SelectField>
        <SelectField name="leashRequired" label="목줄 필요 여부" required>
          {ANSWER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </SelectField>
        <SelectField name="carrierRequired" label="이동장 필요 여부" required>
          {ANSWER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </SelectField>

        <label className="space-y-2 text-sm font-bold text-[#4b423c] sm:col-span-2">리뷰 제목<input name="title" required minLength={3} maxLength={80} className="input rounded-[1rem]" placeholder="예: 소형견과 조용한 시간대에 방문했어요" /></label>
        <label className="space-y-2 text-sm font-bold text-[#4b423c] sm:col-span-2">리뷰 내용<textarea name="body" required minLength={20} maxLength={1200} className="input min-h-40 rounded-[1rem] py-4" placeholder="좌석 위치, 반려동물 응대, 제한 조건, 준비하면 좋은 물품을 중심으로 적어 주세요. 전화번호와 개인정보는 적지 말아 주세요." /></label>

        <div className="rounded-lg bg-[#fafdf9] p-4 text-xs leading-6 text-[var(--muted)] sm:col-span-2">
          사진 업로드는 1차에서는 보류 중입니다. 외부 지도 리뷰 내용이나 다른 사람의 글을 복사하지 말고 직접 방문 경험만 남겨 주세요. 전화번호, 이메일, 보호자 이름 같은 개인정보는 리뷰 본문에 쓰지 마세요.
        </div>

        <button type="submit" className="btn-primary sm:col-span-2 sm:w-fit">검수 요청하기</button>
      </form>
    </main>
  );
}

function SelectField({ name, label, required, children }: { name: string; label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="space-y-2 text-sm font-bold text-[#4b423c]">
      {label}
      <select name={name} required={required} className="input rounded-[1rem]">
        {children}
      </select>
    </label>
  );
}