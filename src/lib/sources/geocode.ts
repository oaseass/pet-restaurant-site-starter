export type GeocodeInput = {
  address: string;
};

export type GeocodeResult = {
  lat: number;
  lng: number;
};

export type GeocodeProvider = "kakao" | "naver";

export type GeocodeDetailedResult = {
  status: "success" | "not-found" | "no-config" | "error";
  provider: GeocodeProvider | null;
  coordinates: GeocodeResult | null;
  attemptedProviders: GeocodeProvider[];
  reason?: string;
};

type NaverGeocodeConfig = {
  keyId: string;
  key: string;
  source: "dedicated" | "legacy";
};

function hasKakaoRestKey() {
  return Boolean(process.env.KAKAO_REST_API_KEY?.trim());
}

function getNaverGeocodeConfig(): NaverGeocodeConfig | null {
  const keyId = process.env.NAVER_MAPS_API_KEY_ID?.trim() || "";
  const key = process.env.NAVER_MAPS_API_KEY?.trim() || "";
  if (keyId && key) {
    return { keyId, key, source: "dedicated" };
  }

  const legacyKeyId = process.env.NAVER_CLIENT_ID?.trim() || "";
  const legacyKey = process.env.NAVER_CLIENT_SECRET?.trim() || "";
  if (legacyKeyId && legacyKey) {
    return { keyId: legacyKeyId, key: legacyKey, source: "legacy" };
  }

  return null;
}

function hasNaverGeocodeKeys() {
  return Boolean(getNaverGeocodeConfig());
}

export function hasGeocodeServerConfig() {
  return hasKakaoRestKey() || hasNaverGeocodeKeys();
}

async function geocodeWithKakao(address: string): Promise<GeocodeResult | null> {
  const restKey = process.env.KAKAO_REST_API_KEY?.trim();
  if (!restKey) return null;

  const response = await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`, {
    cache: "no-store",
    headers: {
      Authorization: `KakaoAK ${restKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Kakao geocode failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json() as {
    documents?: Array<{
      address?: { x?: string; y?: string };
      road_address?: { x?: string; y?: string };
    }>;
  };
  const doc = json.documents?.[0];
  const x = Number(doc?.road_address?.x ?? doc?.address?.x);
  const y = Number(doc?.road_address?.y ?? doc?.address?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { lat: y, lng: x };
}

async function geocodeWithNaver(address: string): Promise<GeocodeResult | null> {
  const config = getNaverGeocodeConfig();
  if (!config) return null;

  const response = await fetch(`https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`, {
    cache: "no-store",
    headers: {
      "x-ncp-apigw-api-key-id": config.keyId,
      "x-ncp-apigw-api-key": config.key,
    },
  });

  if (!response.ok) {
    const baseMessage = `Naver geocode failed: ${response.status} ${response.statusText}`;
    if (config.source === "legacy" && (response.status === 401 || response.status === 403)) {
      throw new Error(`${baseMessage}. This endpoint requires NAVER_MAPS_API_KEY_ID/NAVER_MAPS_API_KEY from Naver Cloud Platform Maps, not NAVER_CLIENT_ID/NAVER_CLIENT_SECRET from Naver Developers.`);
    }

    throw new Error(baseMessage);
  }

  const json = await response.json() as { addresses?: Array<{ y?: string; x?: string }> };
  const first = json.addresses?.[0];
  const lat = Number(first?.y);
  const lng = Number(first?.x);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export async function geocodeAddress(input: GeocodeInput): Promise<GeocodeResult | null> {
  const detailed = await geocodeAddressDetailed(input);
  return detailed.coordinates;
}

export async function geocodeAddressDetailed(input: GeocodeInput): Promise<GeocodeDetailedResult> {
  const address = input.address.trim();
  if (!address) {
    return {
      status: "not-found",
      provider: null,
      coordinates: null,
      attemptedProviders: [],
      reason: "Address is empty.",
    };
  }

  const attemptedProviders: GeocodeProvider[] = [];
  const reasons: string[] = [];
  let hadError = false;

  if (!hasGeocodeServerConfig()) {
    return {
      status: "no-config",
      provider: null,
      coordinates: null,
      attemptedProviders,
      reason: "KAKAO_REST_API_KEY or NAVER_MAPS_API_KEY_ID/NAVER_MAPS_API_KEY is required.",
    };
  }

  if (hasKakaoRestKey()) {
    attemptedProviders.push("kakao");
    try {
      const coordinates = await geocodeWithKakao(address);
      if (coordinates) {
        return {
          status: "success",
          provider: "kakao",
          coordinates,
          attemptedProviders,
        };
      }

      reasons.push("kakao returned no coordinates");
    } catch (error) {
      hadError = true;
      reasons.push(error instanceof Error ? error.message : "kakao geocode failed");
    }
  }

  if (hasNaverGeocodeKeys()) {
    attemptedProviders.push("naver");
    try {
      const coordinates = await geocodeWithNaver(address);
      if (coordinates) {
        return {
          status: "success",
          provider: "naver",
          coordinates,
          attemptedProviders,
        };
      }

      reasons.push("naver returned no coordinates");
    } catch (error) {
      hadError = true;
      reasons.push(error instanceof Error ? error.message : "naver geocode failed");
    }
  }

  return {
    status: hadError ? "error" : "not-found",
    provider: null,
    coordinates: null,
    attemptedProviders,
    reason: reasons.join("; ") || "No coordinates returned.",
  };
}