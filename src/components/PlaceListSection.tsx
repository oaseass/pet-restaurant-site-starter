import Link from "next/link";
import type { PublicPlaceLight } from "@/lib/public-data";

type Props = {
  places: PublicPlaceLight[];
  categoryLabel: string;
  mapHref?: string;
};

export function PlaceListSection({ places, categoryLabel, mapHref }: Props) {
  if (places.length === 0) return null;

  const withCoords = places.filter((p) => p.lat !== null);
  const sidoCounts = new Map<string, number>();
  for (const p of places) {
    if (p.sido) sidoCounts.set(p.sido, (sidoCounts.get(p.sido) ?? 0) + 1);
  }
  const topSidos = [...sidoCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([sido]) => sido);

  return (
    <section className="mx-auto max-w-7xl px-5 py-8">
      {/* 요약 헤더 */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
            {categoryLabel} 업체 목록
          </h2>
          <p className="mt-1 text-sm text-[#9d8e82]">
            총 {places.length.toLocaleString("ko-KR")}건 · 좌표 등록{" "}
            {withCoords.length.toLocaleString("ko-KR")}건
          </p>
        </div>
        {mapHref && (
          <Link href={mapHref} className="btn-primary text-sm">
            지도에서 보기
          </Link>
        )}
      </div>

      {/* 지역 통계 바지 */}
      {topSidos.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {topSidos.map((sido) => (
            <span key={sido} className="badge">
              {sido} {sidoCounts.get(sido)?.toLocaleString("ko-KR")}건
            </span>
          ))}
        </div>
      )}

      {/* 업체 카드 목록 (최대 50건 표시 — 정적 렌더) */}
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {places.slice(0, 50).map((place) => (
          <li
            key={place.id}
            className="rounded-xl border border-[rgba(56,41,29,0.08)] bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <Link href={`/places/${place.id}`} className="font-black text-[#2d1d10] leading-snug hover:text-[var(--brand)] hover:underline">
                {place.name}
              </Link>
              {place.businessStatus && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
                    place.businessStatus === "영업" || place.businessStatus === "정상"
                      ? "bg-green-100 text-green-700"
                      : "bg-[#fef3e8] text-[#b45309]"
                  }`}
                >
                  {place.businessStatus}
                </span>
              )}
            </div>
            {(place.roadAddress ?? place.address) && (
              <p className="mt-1 text-xs text-[#9d8e82] line-clamp-1">
                {place.roadAddress ?? place.address}
              </p>
            )}
            {place.phone && (
              <a
                href={`tel:${place.phone.replace(/\s+/g, "")}`}
                className="mt-1 block text-xs font-black text-[var(--brand)]"
              >
                {place.phone}
              </a>
            )}
            <Link
              href={`/places/${place.id}`}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-black text-[var(--brand)] hover:underline"
            >
              상세보기 →
            </Link>
          </li>
        ))}
      </ul>

      {places.length > 50 && (
        <p className="mt-4 text-center text-sm text-[#9d8e82]">
          상위 50건 표시 · 전체 {places.length.toLocaleString("ko-KR")}건 검색은 지도 또는 검색을 이용하세요.
        </p>
      )}
    </section>
  );
}
