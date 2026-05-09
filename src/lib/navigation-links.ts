export type NavigationLinkInput = {
  name: string;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
};

export type NavigationLinks = {
  kakaoMapUrl: string | null;
  googleMapsUrl: string | null;
  naverMapUrl: string | null;
  tmapUrl: string | null;
  webFallbackUrl: string | null;
  naverWebUrl: string | null;
  copyAddress: string;
  hasCoordinates: boolean;
  hasAddress: boolean;
  canNavigate: boolean;
};

function clean(value?: string | null) {
  const text = value?.trim() ?? "";
  return text && text !== "주소 정보 없음" && text !== "주소 일부 비공개" ? text : "";
}

function hasUsableCoordinate(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value);
}

export function buildNavigationLinks({ name, lat, lng, address }: NavigationLinkInput): NavigationLinks {
  const destinationName = clean(name) || "목적지";
  const copyAddress = clean(address);
  const query = [destinationName, copyAddress].filter(Boolean).join(" ");
  const encodedName = encodeURIComponent(destinationName);
  const encodedQuery = encodeURIComponent(query || destinationName);
  const hasCoordinates = hasUsableCoordinate(lat) && hasUsableCoordinate(lng);
  const hasAddress = copyAddress.length > 0;
  const canNavigate = hasCoordinates || hasAddress;

  if (!canNavigate) {
    return {
      kakaoMapUrl: null,
      googleMapsUrl: null,
      naverMapUrl: null,
      tmapUrl: null,
      webFallbackUrl: null,
      naverWebUrl: null,
      copyAddress,
      hasCoordinates,
      hasAddress,
      canNavigate,
    };
  }

  const latValue = hasCoordinates ? lat!.toFixed(6) : null;
  const lngValue = hasCoordinates ? lng!.toFixed(6) : null;

  return {
    kakaoMapUrl: hasCoordinates
      ? `kakaomap://route?ep=${latValue},${lngValue}&by=CAR`
      : `kakaomap://search?q=${encodedQuery}`,
    googleMapsUrl: hasAddress
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodedQuery}&travelmode=driving`
      : hasCoordinates
        ? `https://www.google.com/maps/dir/?api=1&destination=${latValue},${lngValue}&travelmode=driving`
        : `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`,
    naverMapUrl: hasCoordinates
      ? `nmap://route/car?dlat=${latValue}&dlng=${lngValue}&dname=${encodedName}&appname=pet-restaurant-site-starter`
      : `nmap://search?query=${encodedQuery}&appname=pet-restaurant-site-starter`,
    tmapUrl: hasCoordinates
      ? `tmap://route?goalx=${lngValue}&goaly=${latValue}&goalname=${encodedName}`
      : `tmap://search?name=${encodedQuery}`,
    webFallbackUrl: hasCoordinates
      ? `https://map.kakao.com/link/to/${encodedName},${latValue},${lngValue}`
      : `https://map.kakao.com/link/search/${encodedQuery}`,
    naverWebUrl: `https://map.naver.com/p/search/${encodedQuery}`,
    copyAddress,
    hasCoordinates,
    hasAddress,
    canNavigate,
  };
}