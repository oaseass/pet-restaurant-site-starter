type GeocodeInput = {
  address: string;
};

type GeocodeResult = {
  lat: number;
  lng: number;
};

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
  const clientId = process.env.NAVER_CLIENT_ID?.trim();
  const clientSecret = process.env.NAVER_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  const response = await fetch(`https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`, {
    cache: "no-store",
    headers: {
      "x-ncp-apigw-api-key-id": clientId,
      "x-ncp-apigw-api-key": clientSecret,
    },
  });

  if (!response.ok) {
    throw new Error(`Naver geocode failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json() as { addresses?: Array<{ y?: string; x?: string }> };
  const first = json.addresses?.[0];
  const lat = Number(first?.y);
  const lng = Number(first?.x);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export async function geocodeAddress(input: GeocodeInput): Promise<GeocodeResult | null> {
  const address = input.address.trim();
  if (!address) return null;
  if (!process.env.KAKAO_REST_API_KEY && !(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET)) {
    return null;
  }

  try {
    return await geocodeWithKakao(address);
  } catch {
    return geocodeWithNaver(address);
  }
}