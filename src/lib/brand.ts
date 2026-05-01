export const BRAND_NAME = "댕냥지도";
export const BRAND_TAGLINE = "우리 동네 반려생활을 한눈에";
export const BRAND_SUBTITLE = "식당부터 병원, 미용, 유치원, 여행, 장례, 실종 제보까지 강아지와 고양이를 키우는 사람들을 위한 생활형 지도";
export const BRAND_TITLE = `${BRAND_NAME} | ${BRAND_TAGLINE}`;
export const BRAND_DESCRIPTION =
  "댕냥지도는 반려견·반려묘 보호자를 위한 생활형 지도 서비스입니다. 반려동물 동반 식당, 동물병원, 미용, 유치원, 여행, 장례, 실종 제보 정보를 한곳에서 확인하세요.";

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").trim();
}

export function absoluteUrl(path = "/") {
  const baseUrl = getSiteUrl();
  return new URL(path, baseUrl).toString();
}