import Link from "next/link";
import { MapPin, AlertCircle, PlusCircle } from "lucide-react";

interface RightRailProps {
  restaurantCount?: number;
  lastUpdatedAt?: string | null;
}

const POPULAR_REGIONS = ["서울", "부산", "제주", "경기", "대구", "인천"];

export function RightRail({ restaurantCount, lastUpdatedAt }: RightRailProps) {
  const updatedDateStr = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleDateString("ko-KR")
    : null;

  return (
    <div className="flex flex-col gap-2">
      {/* 지도 열기 */}
      <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin size={13} className="text-[var(--brand)]" />
          <p className="text-xs font-black text-[var(--ink)]">지도에서 찾기</p>
        </div>
        <Link
          href="/map"
          className="block w-full rounded-full bg-[var(--brand)] px-3 py-1.5 text-center text-xs font-bold text-white hover:bg-[#195748] transition-colors"
        >
          지도 열기
        </Link>
      </div>

      {/* 인기 지역 */}
      <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
        <p className="text-xs font-black text-[var(--ink)] mb-2">지역별 탐색</p>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_REGIONS.map((region) => (
            <Link
              key={region}
              href={`/regions/${encodeURIComponent(region)}`}
              className="rounded-full border border-[var(--line)] px-2.5 py-0.5 text-xs font-bold text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)] transition-colors"
            >
              {region}
            </Link>
          ))}
        </div>
      </div>

      {/* 데이터 현황 */}
      {(restaurantCount !== undefined || updatedDateStr) && (
        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
          <p className="text-xs font-black text-[var(--ink)] mb-1.5">데이터 현황</p>
          {restaurantCount !== undefined && (
            <p className="text-xs text-[var(--muted)]">
              등록 식당{" "}
              <span className="font-bold text-[var(--ink)]">
                {restaurantCount.toLocaleString("ko-KR")}건
              </span>
            </p>
          )}
          {updatedDateStr && (
            <p className="text-xs text-[var(--muted)] mt-0.5">
              업데이트{" "}
              <span className="font-bold text-[var(--ink)]">{updatedDateStr}</span>
            </p>
          )}
        </div>
      )}

      {/* 업체 등록 */}
      <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <PlusCircle size={13} className="text-[var(--brand)]" />
          <p className="text-xs font-black text-[var(--ink)]">업체 등록·제보</p>
        </div>
        <Link
          href="/business"
          className="block w-full rounded-full border border-[var(--line)] px-3 py-1.5 text-center text-xs font-bold text-[var(--ink)] hover:border-[var(--line-strong)] transition-colors"
        >
          업체 등록하기
        </Link>
      </div>

      {/* 실종 제보 */}
      <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <AlertCircle size={13} className="text-[var(--accent)]" />
          <p className="text-xs font-black text-[var(--ink)]">댕냥이 찾아요</p>
        </div>
        <Link
          href="/lost-pets"
          className="block w-full rounded-full border border-[var(--line)] px-3 py-1.5 text-center text-xs font-bold text-[var(--ink)] hover:border-[var(--line-strong)] transition-colors"
        >
          제보 보러가기
        </Link>
      </div>
    </div>
  );
}
