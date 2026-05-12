import { Camera, ExternalLink, Info, MessageSquarePlus, MessageSquareWarning, PawPrint, Star, Utensils } from "lucide-react";
import { SmartLink } from "@/components/SmartLink";
import type { BusinessEnrichmentEntry } from "@/lib/business-enrichment";
import { GooglePlacePhoto } from "./GooglePlacePhoto";

type BusinessCategory = "RESTAURANT" | "ANIMAL_HOSPITAL" | "PHARMACY" | "GROOMING" | "DAYCARE" | "FUNERAL";

type BusinessEnrichmentPanelProps = {
  enrichment: BusinessEnrichmentEntry | null;
  category: BusinessCategory;
  reportHref: string;
  reviewHref: string;
  showPhoto?: boolean;
};

const CATEGORY_SUMMARIES: Record<BusinessCategory, string> = {
  RESTAURANT: "지도 정보와 비교해 음식점으로 보이는 곳입니다. 대표 메뉴와 동반 좌석은 매장에 물어보는 편이 좋아요.",
  ANIMAL_HOSPITAL: "지도 정보와 비교해 동물병원으로 보이는 곳입니다. 지금 진료 가능한지는 먼저 전화해보세요.",
  PHARMACY: "지도 정보와 비교해 약국으로 보이는 곳입니다. 찾는 동물의약품 재고는 전화가 가장 빠릅니다.",
  GROOMING: "지도 정보와 비교해 미용 관련 업체로 보이는 곳입니다. 견종·크기에 따라 예약 조건이 달라질 수 있어요.",
  DAYCARE: "지도 정보와 비교해 위탁·호텔·훈련 관련 업체로 보이는 곳입니다. 입소 기준은 상담 때 꼭 확인하세요.",
  FUNERAL: "지도 정보와 비교해 장례 관련 업체로 보이는 곳입니다. 비용과 절차는 업체마다 차이가 큽니다.",
};

function getSourceLabel(source: BusinessEnrichmentEntry["source"]) {
  if (source === "KAKAO") return "카카오 로컬";
  if (source === "NAVER") return "네이버 로컬";
  if (source === "GOOGLE") return "Google Places";
  return "외부 장소 정보";
}

function formatCheckedAt(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("ko-KR");
}

function appendReportTopic(reportHref: string, topic: string) {
  return `${reportHref}${reportHref.includes("?") ? "&" : "?"}topic=${topic}`;
}

function getExternalName(enrichment: BusinessEnrichmentEntry) {
  return enrichment.matchedName ?? enrichment.kakaoPlaceName ?? enrichment.naverTitle ?? enrichment.googlePlaceName ?? "지도에서 이름을 다시 확인해보세요";
}

function getExternalAddress(enrichment: BusinessEnrichmentEntry) {
  return enrichment.roadAddress ?? enrichment.jibunAddress ?? "지도에서 주소를 다시 확인해보세요";
}

function formatGoogleRating(enrichment: BusinessEnrichmentEntry) {
  if (typeof enrichment.googleRating !== "number") return null;
  const reviewLabel = typeof enrichment.googleUserRatingCount === "number" && enrichment.googleUserRatingCount > 0
    ? ` · 리뷰 ${enrichment.googleUserRatingCount.toLocaleString("ko-KR")}개`
    : "";
  return `${enrichment.googleRating.toFixed(1)}${reviewLabel}`;
}

function getOpeningPreview(enrichment: BusinessEnrichmentEntry) {
  const firstLine = enrichment.googleOpeningHours?.find((line) => line.trim().length > 0);
  return firstLine ?? null;
}

function DetailItem({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-black text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 text-sm font-bold leading-6 text-[var(--ink)]">{value}</dd>
    </div>
  );
}

export function BusinessEnrichmentPanel({ enrichment, category, reportHref, reviewHref, showPhoto = true }: BusinessEnrichmentPanelProps) {
  const canDisplay = enrichment && enrichment.matchScore >= 0.85;
  const isCandidate = enrichment && enrichment.matchScore >= 0.65 && enrichment.matchScore < 0.85;
  const visibleEnrichment = canDisplay ? enrichment : null;
  const showDetailedActions = Boolean(visibleEnrichment);
  const checkedAtLabel = formatCheckedAt(visibleEnrichment?.enrichedAt ?? visibleEnrichment?.checkedAt);
  const googleRatingLabel = visibleEnrichment ? formatGoogleRating(visibleEnrichment) : null;
  const openingPreview = visibleEnrichment ? getOpeningPreview(visibleEnrichment) : null;
  const sourceLinks = visibleEnrichment
    ? [
        { href: visibleEnrichment.kakaoPlaceUrl, label: "카카오맵에서 리뷰 확인" },
        { href: visibleEnrichment.naverPlaceUrl, label: "네이버지도에서 리뷰 확인" },
        { href: visibleEnrichment.googleMapsUri, label: "구글지도에서 사진·리뷰 확인" },
        { href: visibleEnrichment.googleWebsiteUri, label: "공식 사이트 보기" },
        visibleEnrichment.externalPlaceUrl && !visibleEnrichment.kakaoPlaceUrl && !visibleEnrichment.naverPlaceUrl && !visibleEnrichment.googleMapsUri
          ? { href: visibleEnrichment.externalPlaceUrl, label: "외부 지도에서 리뷰 확인" }
          : null,
      ].filter((link): link is { href: string; label: string } => Boolean(link?.href))
    : [];

  return (
    <section className="card rounded-[1rem] p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand)]">
          <Info size={18} />
        </span>
        <div>
          <h2 className="text-xl font-black tracking-tight text-[var(--ink)]">외부 지도와 비교한 정보</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            카카오·네이버·Google 지도에서 이름과 주소가 잘 맞는 경우에만 보여드립니다. 외부 리뷰 본문은 저장하지 않고, 방문 판단에 필요한 링크만 연결합니다.
          </p>
        </div>
      </div>

      {visibleEnrichment ? (
        <div className="mt-5 rounded-xl border border-[var(--line)] bg-white p-4">
          {showPhoto && visibleEnrichment.googlePhotoName ? (
            <div className="mb-4">
              <GooglePlacePhoto
                photoName={visibleEnrichment.googlePhotoName}
                alt={`${getExternalName(visibleEnrichment)} 장소 사진`}
                authorName={visibleEnrichment.googlePhotoAuthorName}
                authorUri={visibleEnrichment.googlePhotoAuthorUri}
                rating={visibleEnrichment.googleRating}
                userRatingCount={visibleEnrichment.googleUserRatingCount}
              />
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-black text-[var(--brand)]">{getSourceLabel(visibleEnrichment.source)}</span>
            <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-black text-[var(--muted)]">이름·주소가 잘 맞아요</span>
            <span className="rounded-full bg-[#ecfdf5] px-3 py-1 text-xs font-black text-[#047857]">지도 링크 제공</span>
            {visibleEnrichment.googlePhotoName ? <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-black text-[#1d4ed8]">Google 사진 연결</span> : null}
            {googleRatingLabel ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff7ed] px-3 py-1 text-xs font-black text-[#c2410c]">
                <Star size={13} fill="currentColor" />
                {googleRatingLabel}
              </span>
            ) : null}
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <DetailItem label="지도 장소명" value={getExternalName(visibleEnrichment)} />
            <DetailItem label="지도 분류" value={visibleEnrichment.externalCategory ?? "분류는 지도에서 다시 보세요"} />
            <DetailItem label="지도 전화번호" value={visibleEnrichment.phone ?? "전화번호는 아직 없어요"} />
            <DetailItem label="지도 주소" value={getExternalAddress(visibleEnrichment)} wide />
            <DetailItem label="어떤 업체인지" value={CATEGORY_SUMMARIES[category]} wide />
            <DetailItem label="영업정보" value={openingPreview ?? "오늘 운영은 업체에 물어보세요"} />
            <DetailItem label="메뉴·서비스" value="아직 제보가 더 필요해요" />
            {visibleEnrichment.googleEditorialSummary ? <DetailItem label="Google 요약" value={visibleEnrichment.googleEditorialSummary} wide /> : null}
            {checkedAtLabel ? <DetailItem label="비교한 날짜" value={checkedAtLabel} /> : null}
          </dl>

          {sourceLinks.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {sourceLinks.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--ink)]">
                  <ExternalLink size={14} />
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : isCandidate ? (
        <div className="mt-5 rounded-lg border border-dashed border-[#fed7aa] bg-[#fff7ed] px-4 py-3">
          <p className="text-sm font-black text-[#9a3412]">지도 결과가 애매해 아직 숨겨두고 있습니다</p>
          <p className="mt-1 text-sm leading-6 text-[#9a3412]">이름이나 주소가 완전히 맞지 않아 잘못 연결될 가능성이 있습니다. 확인 전에는 보수적으로 보여주지 않습니다.</p>
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-[var(--line)] bg-[#f9fbfa] px-4 py-3">
          <p className="text-sm font-black text-[var(--ink)]">외부 지도에서 일치하는 정보를 아직 찾지 못했습니다</p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">지금은 공식 등록 정보와 사용자 제보를 우선 보여드립니다. 전화번호나 서비스가 다르면 알려주세요.</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <SmartLink href={reviewHref} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--brand)] bg-[var(--brand)] px-4 text-xs font-black text-white">
          <MessageSquarePlus size={14} />
          방문 후기 남기기
        </SmartLink>
        {showDetailedActions ? (
          <>
            <SmartLink href={appendReportTopic(reportHref, "service")} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--ink)]">
              <Utensils size={14} />
              메뉴·서비스 알려주기
            </SmartLink>
            <SmartLink href={appendReportTopic(reportHref, "photo")} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--ink)]">
              <Camera size={14} />
              사진 올리기
            </SmartLink>
            <SmartLink href={appendReportTopic(reportHref, "pet-policy")} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--ink)]">
              <PawPrint size={14} />
              동반 조건 알려주기
            </SmartLink>
          </>
        ) : null}
        <SmartLink href={reportHref} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-xs font-black text-[var(--muted)]">
          <MessageSquareWarning size={14} />
          {showDetailedActions ? "정보 수정 요청" : "빠진 정보 알려주기"}
        </SmartLink>
      </div>
    </section>
  );
}