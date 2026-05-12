import { AlertTriangle, MapPin, Plus } from "lucide-react";
import { SmartLink } from "@/components/SmartLink";

interface RightRailProps {
  restaurantCount?: number;
  registeredPlaceCount?: number;
  lastUpdatedAt?: string | null;
}

const REGION_LINKS = [
  { label: "서울", href: "/regions/서울" },
  { label: "경기", href: "/regions/경기" },
  { label: "부산", href: "/regions/부산" },
  { label: "광주", href: "/regions/광주" },
  { label: "제주", href: "/regions/제주" },
  { label: "전체", href: "/restaurants" },
];

export function RightRail({ restaurantCount, registeredPlaceCount, lastUpdatedAt }: RightRailProps) {
  const updatedDateStr = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleDateString("ko-KR")
    : null;
  const totalCount = registeredPlaceCount ?? restaurantCount;
  const title = registeredPlaceCount !== undefined ? "현재 등록 장소" : "현재 공개 식당";

  return (
    <div className="space-y-4 lg:sticky lg:top-[72px]">
      <section className="overflow-hidden rounded-[1.25rem] bg-[var(--brand)] p-5 text-white shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.04em] text-white/75">지도에서 찾기</p>
            <h2 className="mt-2 text-lg font-black tracking-tight">{title}</h2>
            <p className="mt-1 text-sm font-semibold text-white/85">
              {totalCount !== undefined ? `${totalCount.toLocaleString("ko-KR")}곳` : "업데이트 예정"}
            </p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <MapPin size={20} />
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-white/80">반려동물과 함께 갈 수 있는 장소를 지도와 목록에서 함께 비교해보세요.</p>
        <SmartLink href="/map" pendingLabel="지도 여는 중..." className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-black text-[var(--brand)]">
          지도 열기
        </SmartLink>
      </section>

      <section className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface)] p-4">
        <h3 className="text-[15px] font-black tracking-tight text-[var(--ink)]">지역별 탐색</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {REGION_LINKS.map((region) => (
            <SmartLink
              key={region.label}
              href={region.href}
              className="inline-flex min-h-9 items-center rounded-full border border-[var(--line)] bg-[#f9faf9] px-3 text-xs font-bold text-[var(--muted)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              {region.label}
            </SmartLink>
          ))}
        </div>
      </section>

      <section className="rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface)] p-4">
        <h3 className="text-[15px] font-black tracking-tight text-[var(--ink)]">제보·등록</h3>
        <div className="mt-3 grid gap-2">
          <SmartLink href="/business" className="inline-flex min-h-11 items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--primary-soft)] px-4 text-sm font-black text-[var(--brand)] transition hover:border-[var(--brand)]">
            <span className="inline-flex items-center gap-2"><Plus size={15} /> 업체 등록하기</span>
            <span>→</span>
          </SmartLink>
          <SmartLink href="/lost-pets" className="inline-flex min-h-11 items-center justify-between rounded-xl border border-[var(--line)] bg-[#fff8eb] px-4 text-sm font-black text-[#9a6700] transition hover:border-[#f59e0b]">
            <span className="inline-flex items-center gap-2"><AlertTriangle size={15} /> 실종 제보하기</span>
            <span>→</span>
          </SmartLink>
        </div>
      </section>

      <p className="px-1 text-[12px] leading-5 text-[var(--muted)]">
        정보 기준: 식품안전나라 공개자료 및 사용자 제보 기반
        {updatedDateStr ? ` · 최근 업데이트 ${updatedDateStr}` : ""}
      </p>
    </div>
  );
}
