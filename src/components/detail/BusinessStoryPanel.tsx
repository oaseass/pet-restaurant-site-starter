import { Camera, CheckCircle2, Clock3, ExternalLink, Info, PawPrint, Sparkles, Tag } from "lucide-react";
import { GooglePlacePhoto } from "@/components/detail/GooglePlacePhoto";
import { SmartLink } from "@/components/SmartLink";
import type { BusinessEnrichmentEntry } from "@/lib/business-enrichment";
import { formatBusinessCheckDate, type BusinessCheckSummary } from "@/lib/business-checks-shared";
import type { PublicPlaceProfile } from "@/lib/place-profiles";
import type { VisitInfoCategory } from "@/components/detail/VisitInfoPanel";

type BusinessStoryPanelProps = {
  name: string;
  category: VisitInfoCategory;
  categoryLabel: string;
  identityLabel: string;
  regionLabel: string;
  profile?: PublicPlaceProfile | null;
  enrichment?: BusinessEnrichmentEntry | null;
  checkSummary?: BusinessCheckSummary | null;
  reportHref: string;
  reviewHref: string;
};

const CATEGORY_STORY: Record<VisitInfoCategory, string> = {
  RESTAURANT: "반려동물 동반 등록 정보를 바탕으로, 함께 앉을 수 있는 좌석과 방문 조건을 확인해볼 만한 식당입니다.",
  ANIMAL_HOSPITAL: "오늘 진료 가능한 증상과 예약 여부를 먼저 확인하면 좋은 동물병원입니다.",
  PHARMACY: "동물의약품 재고와 처방전 필요 여부를 전화로 확인하면 헛걸음을 줄일 수 있는 약국입니다.",
  GROOMING: "견종, 체중, 피부 상태에 따라 예약 조건이 달라질 수 있는 미용 업체입니다.",
  DAYCARE: "입소 기준과 프로그램 운영 방식을 상담으로 확인하면 좋은 유치원·호텔 업체입니다.",
  FUNERAL: "상담 가능 시간, 운구 가능 지역, 절차와 비용을 먼저 확인해야 하는 장례 업체입니다.",
};

const CATEGORY_POINTS: Record<VisitInfoCategory, string[]> = {
  RESTAURANT: ["실내·야외 좌석", "대형견 제한", "이동장·목줄 조건", "피크타임 동반 가능 여부"],
  ANIMAL_HOSPITAL: ["오늘 진료 가능", "예약 필요 여부", "야간·응급 대응", "주차·대기 방식"],
  PHARMACY: ["동물의약품 재고", "처방전 필요 여부", "강아지·고양이 용량 안내", "오늘 영업시간"],
  GROOMING: ["예약 가능 시간", "견종·체중 제한", "발톱·귀 관리 포함", "노령견·피부 상담"],
  DAYCARE: ["입소 기준", "예방접종 증명", "호텔링 가능", "픽업·CCTV 제공"],
  FUNERAL: ["상담 가능 시간", "운구 가능 지역", "화장·봉안 절차", "총 비용 포함 항목"],
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

function getMainStory({ category, profile, enrichment, identityLabel, regionLabel }: BusinessStoryPanelProps) {
  if (profile?.description) return profile.description;
  if (enrichment?.googleEditorialSummary) return enrichment.googleEditorialSummary;
  const externalCategory = enrichment?.externalCategory ?? enrichment?.googlePrimaryType;
  const categoryHint = externalCategory ? `${externalCategory} 정보와 매칭되는 곳입니다.` : `${identityLabel}로 분류된 곳입니다.`;
  return `${regionLabel}에서 ${CATEGORY_STORY[category]} ${categoryHint}`;
}

function getBooleanLabel(label: string, value?: boolean | null) {
  if (value === true) return label;
  if (value === false) return `${label} 확인 필요`;
  return null;
}

function getPolicyTags(profile?: PublicPlaceProfile | null) {
  if (!profile) return [];
  return [
    getBooleanLabel("주차 가능", profile.parkingAvailable),
    getBooleanLabel("실내 가능", profile.indoorAllowed),
    getBooleanLabel("실외 가능", profile.outdoorAllowed),
    getBooleanLabel("대형견 가능", profile.largeDogAllowed),
    getBooleanLabel("고양이 가능", profile.catAllowed),
    getBooleanLabel("리드줄 필요", profile.leashRequired),
    getBooleanLabel("케이지 필요", profile.cageRequired),
  ].filter((item): item is string => Boolean(item));
}

function getPhotoName(enrichment?: BusinessEnrichmentEntry | null) {
  return enrichment?.googlePhotoName ?? null;
}

function getOpeningLabel(profile?: PublicPlaceProfile | null, enrichment?: BusinessEnrichmentEntry | null) {
  if (profile?.openingHours) return profile.openingHours;
  return enrichment?.googleOpeningHours?.find((line) => line.trim().length > 0) ?? "오늘 운영은 전화로 확인";
}

function getPriceLabel(profile?: PublicPlaceProfile | null) {
  return profile?.priceText ?? "가격·비용 정보는 제보를 기다리는 중";
}

function getFreshnessLabel(profile?: PublicPlaceProfile | null, checkSummary?: BusinessCheckSummary | null, enrichment?: BusinessEnrichmentEntry | null) {
  if (checkSummary?.latestCheckedAt) return `최근 확인 ${formatBusinessCheckDate(checkSummary.latestCheckedAt)}`;
  const profileDate = formatDate(profile?.ownerUpdatedAt ?? profile?.updatedAt);
  if (profileDate) return `프로필 업데이트 ${profileDate}`;
  const enrichmentDate = formatDate(enrichment?.checkedAt ?? enrichment?.enrichedAt);
  if (enrichmentDate) return `지도 비교 ${enrichmentDate}`;
  return "확인 정보 보강 중";
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof Info; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-white px-3 py-3">
      <div className="flex items-center gap-2 text-xs font-black text-[var(--brand)]">
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-2 whitespace-pre-line text-sm font-bold leading-6 text-[var(--ink)]">{value}</p>
    </div>
  );
}

export function BusinessStoryPanel(props: BusinessStoryPanelProps) {
  const { name, category, categoryLabel, profile, enrichment, checkSummary, reportHref, reviewHref } = props;
  const photoName = getPhotoName(enrichment);
  const serviceTags = [...(profile?.serviceTags ?? []), ...getPolicyTags(profile)].slice(0, 10);
  const points = CATEGORY_POINTS[category];
  const sourceTags = [props.identityLabel, enrichment?.externalCategory ?? enrichment?.googlePrimaryType, getFreshnessLabel(profile, checkSummary, enrichment)].filter((item): item is string => Boolean(item));

  return (
    <section className="mt-6 rounded-[1rem] border border-[var(--line)] bg-white p-5 shadow-sm">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)]">
        <div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
              <Sparkles size={18} />
            </span>
            <div>
              <p className="text-[11px] font-black tracking-[0.04em] text-[var(--brand)]">이런 곳이에요</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--ink)]">{name} 한눈에 보기</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{getMainStory(props)}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
            {sourceTags.map((tag) => (
              <span key={tag} className="rounded-full bg-[#f3f4f6] px-3 py-1 text-[var(--muted)]">{tag}</span>
            ))}
          </div>

          {serviceTags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
              {serviceTags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-soft)] px-3 py-1 text-[var(--brand)]">
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoTile icon={Clock3} label="운영 힌트" value={getOpeningLabel(profile, enrichment)} />
            <InfoTile icon={PawPrint} label="비용·이용" value={getPriceLabel(profile)} />
          </div>

          <div className="mt-5 rounded-lg border border-[rgba(31,107,91,0.16)] bg-[#f8faf9] px-4 py-3">
            <p className="text-sm font-black text-[var(--ink)]">가보기 전에 보면 좋은 것</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {points.map((point) => (
                <div key={point} className="flex gap-2 text-sm leading-6 text-[var(--muted)]">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--brand)]" size={15} />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {profile?.reservationUrl ? (
              <a href={profile.reservationUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--brand)] px-4 text-xs font-black text-white">
                <ExternalLink size={14} />
                예약·공식 정보
              </a>
            ) : null}
            <SmartLink href={reviewHref} className="inline-flex min-h-10 items-center rounded-full border border-[var(--brand)] px-4 text-xs font-black text-[var(--brand)]">
              후기 남기기
            </SmartLink>
            <SmartLink href={`${reportHref}&topic=service`} className="inline-flex min-h-10 items-center rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--ink)]">
              정보 보강하기
            </SmartLink>
          </div>
        </div>

        <div className="min-w-0">
          {photoName ? (
            <GooglePlacePhoto
              photoName={photoName}
              alt={`${name} 장소 사진`}
              authorName={enrichment?.googlePhotoAuthorName}
              authorUri={enrichment?.googlePhotoAuthorUri}
              rating={enrichment?.googleRating}
              userRatingCount={enrichment?.googleUserRatingCount}
            />
          ) : (
            <div className="flex min-h-[260px] flex-col justify-between rounded-xl border border-dashed border-[var(--line-strong)] bg-[#fbfcf8] p-5">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
                  <Camera size={19} />
                </div>
                <p className="mt-4 text-lg font-black text-[var(--ink)]">사진과 실제 분위기를 채워가는 중</p>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  업체 사진, 내부·외부 모습, 대표 서비스가 확인되면 이 영역에 먼저 보여드립니다.
                </p>
              </div>
              <SmartLink href={`${reportHref}&topic=photo`} className="mt-5 inline-flex min-h-10 w-fit items-center rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--ink)]">
                사진 정보 알려주기
              </SmartLink>
            </div>
          )}
          <p className="mt-3 text-xs font-bold leading-5 text-[var(--muted)]">
            {categoryLabel} 정보는 공개자료, 지도 비교, 사용자 제보, 운영자 확인을 분리해 보여드립니다.
          </p>
        </div>
      </div>
    </section>
  );
}
