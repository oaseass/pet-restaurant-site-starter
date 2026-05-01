type GeocodeInput = {
  address: string;
};

export async function geocodeAddress(_input: GeocodeInput) {
  if (!process.env.KAKAO_REST_API_KEY && !process.env.NAVER_CLIENT_ID) {
    return null;
  }

  // External geocoding is intentionally reserved for server-side batch jobs only.
  return null;
}