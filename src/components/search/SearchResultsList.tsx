import { MapPin } from "lucide-react";
import type { SearchRestaurantResult, SearchPlaceResult } from "@/lib/public-search";
import { PLACE_CATEGORY_LABELS as GUIDE_CATEGORY_LABELS, type GuideDoc } from "@/lib/platform-content";
import { SmartLink } from "@/components/SmartLink";

const PLACE_CATEGORY_LABELS: Record<string, string> = {
  ANIMAL_HOSPITAL: "동물병원",
  PHARMACY: "동물약국",
  GROOMING: "미용",
  DAYCARE: "유치원·호텔",
  FUNERAL: "장례",
};

interface SearchResultsListProps {
  restaurants: SearchRestaurantResult[];
  places?: SearchPlaceResult[];
  guides: GuideDoc[];
  keyword: string;
}

function normalizeDisplayName(name: string) {
  return name.trim().replace(/^#+\s*/, "").trim();
}

function isLowConfidencePlaceName(name: string) {
  const trimmed = normalizeDisplayName(name);
  if (!trimmed) return true;
  if (/^#?[a-z_-]+$/i.test(trimmed) && !/[가-힣]/.test(trimmed)) return true;
  return false;
}

function getDisplayPlaceName(place: SearchPlaceResult) {
  const cleanedName = normalizeDisplayName(place.name);
  if (!isLowConfidencePlaceName(place.name)) return cleanedName;
  const label = place.categoryLabel ?? PLACE_CATEGORY_LABELS[place.category] ?? "시설";
  const region = [place.sido, place.sigungu].filter(Boolean).join(" ");
  return region ? `${region} ${label}` : `${label} 업체`;
}

export function SearchResultsList({ restaurants, places = [], guides, keyword }: SearchResultsListProps) {
  const total = restaurants.length + places.length + guides.length;

  return (
    <div>
      {/* 결과 요약 + 지도 버튼 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "7px 14px",
          background: "#fafdf9",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <span style={{ fontSize: "12px", color: "#666" }}>
          {total === 0 ? (
            <span style={{ color: "#aaa" }}>결과 없음</span>
          ) : (
            <>
              {restaurants.length > 0 && <>식당 <strong style={{ color: "#222" }}>{restaurants.length}</strong>건</>}
              {places.length > 0 && <>{restaurants.length > 0 ? " · " : ""}시설 <strong style={{ color: "#222" }}>{places.length}</strong>건</>}
              {guides.length > 0 && <>{(restaurants.length > 0 || places.length > 0) ? " · " : ""}가이드 <strong style={{ color: "#222" }}>{guides.length}</strong>건</>}
            </>
          )}
        </span>
        {keyword && (
          <SmartLink
            href={`/map?q=${encodeURIComponent(keyword)}`}
            pendingLabel="지도 여는 중..."
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--brand)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <MapPin size={11} />
            지도에서 보기
          </SmartLink>
        )}
      </div>

      {/* 빈 결과 */}
      {total === 0 && keyword && (
        <div style={{ padding: "36px 14px", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: "#555", fontWeight: 700, marginBottom: "6px" }}>
            검색 결과가 없습니다.
          </p>
          <p style={{ fontSize: "12px", color: "#999", marginBottom: "14px" }}>
            다른 키워드나 지역명으로 다시 검색해 보세요.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
            {["서울", "광주", "카페", "조개"].map((kw) => (
              <SmartLink
                key={kw}
                href={`/search?q=${encodeURIComponent(kw)}`}
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--brand)",
                  background: "var(--brand-soft)",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  textDecoration: "none",
                }}
              >
                {kw}
              </SmartLink>
            ))}
          </div>
        </div>
      )}

      {/* 식당 결과 compact list */}
      {restaurants.length > 0 && (
        <div>
          {restaurants.map((r) => (
            <div
              key={r.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 14px",
                borderBottom: "1px solid var(--line)",
                minHeight: "48px",
              }}
              className="hover:bg-[var(--bg)]"
            >
              <SmartLink
                href={`/restaurants/${r.id}`}
                style={{
                  flex: 1,
                  color: "var(--ink)",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  minWidth: 0,
                }}
              >
                {/* 분류 뱃지 */}
                <span
                  style={{
                    minWidth: "34px",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#1f6b5b",
                    background: "#f0fdf4",
                    borderRadius: "4px",
                    padding: "2px 3px",
                    flexShrink: 0,
                    textAlign: "center",
                  }}
                >
                  식당
                </span>

                {/* 업체명 */}
                <span
                  style={{
                  flex: 1,
                  fontSize: "14px",
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  }}
                >
                  {r.name}
                </span>

                {/* 지역 */}
                <span
                  style={{
                    fontSize: "11px",
                    color: "#888",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <MapPin size={9} />
                  {r.sido} {r.sigungu ?? ""}
                </span>

                {/* 업종 - 데스크탑만 */}
                <span
                  style={{
                    fontSize: "10px",
                    color: "#bbb",
                    flexShrink: 0,
                  }}
                  className="hidden sm:block"
                >
                  {r.businessType}
                </span>
              </SmartLink>

              {/* 액션 버튼 */}
              <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                <SmartLink
                  href={`/map?q=${encodeURIComponent(r.name)}`}
                  pendingLabel="지도 여는 중..."
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "var(--brand)",
                    textDecoration: "none",
                    padding: "3px 7px",
                    background: "var(--brand-soft)",
                    borderRadius: "5px",
                  }}
                >
                  지도
                </SmartLink>
                <SmartLink
                  href={`/restaurants/${r.id}`}
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#555",
                    textDecoration: "none",
                    padding: "3px 7px",
                    background: "#f3f4f6",
                    borderRadius: "5px",
                  }}
                >
                  상세
                </SmartLink>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 시설 결과 (병원·약국·미용·위탁·장례) */}
      {places.length > 0 && (
        <div style={{ marginTop: restaurants.length > 0 ? "8px" : 0 }}>
          <div
            style={{
              padding: "6px 14px 4px",
              fontSize: "11px",
              fontWeight: 800,
              color: "#888",
              borderBottom: "1px solid var(--line)",
              background: "var(--bg)",
            }}
          >
            시설
          </div>
          {places.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 14px",
                borderBottom: "1px solid var(--line)",
                minHeight: "48px",
              }}
              className="hover:bg-[var(--bg)]"
            >
              <SmartLink
                href={`/places/${p.id}`}
                style={{
                  flex: 1,
                  color: "var(--ink)",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    minWidth: "34px",
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#0369a1",
                    background: "#e0f2fe",
                    borderRadius: "4px",
                    padding: "2px 3px",
                    flexShrink: 0,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.categoryLabel ?? PLACE_CATEGORY_LABELS[p.category] ?? p.category}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontSize: "14px",
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {getDisplayPlaceName(p)}
                </span>
                <span style={{ fontSize: "11px", color: "#888", flexShrink: 0, display: "flex", alignItems: "center", gap: "2px" }}>
                  <MapPin size={9} />
                  {p.sido} {p.sigungu ?? ""}
                </span>
              </SmartLink>
              <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                {p.lat !== null && (
                  <SmartLink
                    href={`/map?q=${encodeURIComponent(getDisplayPlaceName(p))}&category=${p.category.toLowerCase()}`}
                    pendingLabel="지도 여는 중..."
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--brand)",
                      textDecoration: "none",
                      padding: "3px 7px",
                      background: "var(--brand-soft)",
                      borderRadius: "5px",
                    }}
                  >
                    지도
                  </SmartLink>
                )}
                <SmartLink
                  href={`/places/${p.id}`}
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#555",
                    textDecoration: "none",
                    padding: "3px 7px",
                    background: "#f3f4f6",
                    borderRadius: "5px",
                  }}
                >
                  상세
                </SmartLink>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 가이드 결과 */}
      {guides.length > 0 && (
        <div style={{ marginTop: restaurants.length > 0 ? "8px" : 0 }}>
          <div
            style={{
              padding: "6px 14px 4px",
              fontSize: "11px",
              fontWeight: 800,
              color: "#888",
              borderBottom: "1px solid var(--line)",
              background: "var(--bg)",
            }}
          >
            가이드
          </div>
          {guides.map((g) => (
            <SmartLink
              key={g.slug}
              href={`/guide/${g.slug}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 14px",
                borderBottom: "1px solid var(--line)",
                textDecoration: "none",
                minHeight: "44px",
              }}
              className="hover:bg-[var(--bg)]"
            >
              <span
                style={{
                  minWidth: "34px",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#7c3aed",
                  background: "#f5f3ff",
                  borderRadius: "4px",
                  padding: "2px 3px",
                  flexShrink: 0,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                가이드
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--ink)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {g.title}
              </span>
              <span style={{ fontSize: "11px", color: "#aaa", flexShrink: 0 }}>
                {GUIDE_CATEGORY_LABELS[g.category] ?? "가이드"}
              </span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#7c3aed", flexShrink: 0 }}>
                보기 →
              </span>
            </SmartLink>
          ))}
        </div>
      )}
    </div>
  );
}
