import {
  calculateBusinessMatchScoreDetailed,
  type BusinessEnrichmentEntry,
  type BusinessEnrichmentTargetType,
} from "@/lib/business-enrichment";

type GoogleVisualCategory = "RESTAURANT" | "ANIMAL_HOSPITAL" | "PHARMACY" | "GROOMING" | "DAYCARE" | "FUNERAL";

type GoogleVisualTarget = {
  targetType: BusinessEnrichmentTargetType;
  targetId: string;
  category: GoogleVisualCategory;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

type GoogleVisualCandidate = {
  name: string;
  category: string | null;
  phone: string | null;
  roadAddress: string | null;
  address: string | null;
  url: string | null;
  lat: number | null;
  lng: number | null;
  googlePlaceResourceName: string | null;
  googleRating: number | null;
  googleUserRatingCount: number | null;
  googlePhotoName: string | null;
  googlePhotoAuthorName: string | null;
  googlePhotoAuthorUri: string | null;
  googleOpeningHours: string[] | null;
  googleEditorialSummary: string | null;
  googleWebsiteUri: string | null;
  score: number;
  autoApplicable: boolean;
};

function getGooglePlacesApiKey() {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || null;
}

function parseFiniteNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function parseInteger(value: unknown) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) ? numberValue : null;
}

function buildGoogleQuery(target: GoogleVisualTarget) {
  const region = target.address?.split(" ").slice(0, 2).join(" ") ?? "";
  return `${region} ${target.name}`.trim();
}

function toEntry(target: GoogleVisualTarget, candidate: GoogleVisualCandidate): BusinessEnrichmentEntry {
  const checkedAt = new Date().toISOString();
  return {
    targetType: target.targetType,
    targetId: target.targetId,
    source: "GOOGLE",
    matchScore: candidate.score,
    matchedName: candidate.name || null,
    externalCategory: candidate.category,
    phone: candidate.phone,
    roadAddress: candidate.roadAddress,
    jibunAddress: candidate.address,
    externalPlaceUrl: candidate.url,
    kakaoPlaceUrl: null,
    naverPlaceUrl: null,
    googleMapsUri: candidate.url,
    kakaoPlaceName: null,
    kakaoCategoryName: null,
    kakaoPhone: null,
    kakaoRoadAddress: null,
    naverTitle: null,
    naverCategory: null,
    naverLink: null,
    googlePlaceResourceName: candidate.googlePlaceResourceName,
    googlePlaceName: candidate.name || null,
    googlePrimaryType: candidate.category,
    googleRating: candidate.googleRating,
    googleUserRatingCount: candidate.googleUserRatingCount,
    googlePhotoName: candidate.googlePhotoName,
    googlePhotoAuthorName: candidate.googlePhotoAuthorName,
    googlePhotoAuthorUri: candidate.googlePhotoAuthorUri,
    googleOpeningHours: candidate.googleOpeningHours,
    googleEditorialSummary: candidate.googleEditorialSummary,
    googleWebsiteUri: candidate.googleWebsiteUri,
    enrichedAt: checkedAt,
    checkedAt,
  };
}

function mergeGoogleField<T>(baseValue: T | null | undefined, googleValue: T | null | undefined) {
  return baseValue ?? googleValue ?? null;
}

export function mergeGoogleVisualEnrichment(base: BusinessEnrichmentEntry | null, googleVisual: BusinessEnrichmentEntry | null) {
  if (!googleVisual) return base;
  if (!base || base.matchScore < 0.85) return googleVisual;

  return {
    ...base,
    googleMapsUri: mergeGoogleField(base.googleMapsUri, googleVisual.googleMapsUri),
    googlePlaceResourceName: mergeGoogleField(base.googlePlaceResourceName, googleVisual.googlePlaceResourceName),
    googlePlaceName: mergeGoogleField(base.googlePlaceName, googleVisual.googlePlaceName),
    googlePrimaryType: mergeGoogleField(base.googlePrimaryType, googleVisual.googlePrimaryType),
    googleRating: mergeGoogleField(base.googleRating, googleVisual.googleRating),
    googleUserRatingCount: mergeGoogleField(base.googleUserRatingCount, googleVisual.googleUserRatingCount),
    googlePhotoName: mergeGoogleField(base.googlePhotoName, googleVisual.googlePhotoName),
    googlePhotoAuthorName: mergeGoogleField(base.googlePhotoAuthorName, googleVisual.googlePhotoAuthorName),
    googlePhotoAuthorUri: mergeGoogleField(base.googlePhotoAuthorUri, googleVisual.googlePhotoAuthorUri),
    googleOpeningHours: mergeGoogleField(base.googleOpeningHours, googleVisual.googleOpeningHours),
    googleEditorialSummary: mergeGoogleField(base.googleEditorialSummary, googleVisual.googleEditorialSummary),
    googleWebsiteUri: mergeGoogleField(base.googleWebsiteUri, googleVisual.googleWebsiteUri),
    enrichedAt: base.enrichedAt ?? googleVisual.enrichedAt ?? null,
  };
}

export async function getGooglePlaceVisualEnrichment(target: GoogleVisualTarget): Promise<BusinessEnrichmentEntry | null> {
  const apiKey = getGooglePlacesApiKey();
  if (!apiKey) return null;

  const body: Record<string, unknown> = {
    textQuery: buildGoogleQuery(target),
    languageCode: "ko",
    regionCode: "KR",
    maxResultCount: 5,
  };
  if (typeof target.lat === "number" && typeof target.lng === "number") {
    body.locationBias = {
      circle: {
        center: { latitude: target.lat, longitude: target.lng },
        radius: 2000,
      },
    };
  }

  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.name,places.displayName,places.formattedAddress,places.googleMapsUri,places.primaryType,places.primaryTypeDisplayName,places.nationalPhoneNumber,places.location,places.rating,places.userRatingCount,places.photos,places.regularOpeningHours.weekdayDescriptions,places.editorialSummary,places.websiteUri",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 60 * 60 * 24 * 14 },
    });
    if (!response.ok) return null;

    const json = await response.json() as {
      places?: Array<{
        name?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        googleMapsUri?: string;
        primaryType?: string;
        primaryTypeDisplayName?: { text?: string };
        nationalPhoneNumber?: string;
        location?: { latitude?: number; longitude?: number };
        rating?: number;
        userRatingCount?: number;
        photos?: Array<{ name?: string; authorAttributions?: Array<{ displayName?: string; uri?: string }> }>;
        regularOpeningHours?: { weekdayDescriptions?: string[] };
        editorialSummary?: { text?: string };
        websiteUri?: string;
      }>;
    };

    const candidates = (json.places ?? []).map((place): GoogleVisualCandidate => {
      const primaryPhoto = place.photos?.find((photo) => Boolean(photo.name));
      const primaryPhotoAuthor = primaryPhoto?.authorAttributions?.[0];
      const candidate = {
        name: place.displayName?.text ?? "",
        category: place.primaryTypeDisplayName?.text ?? place.primaryType ?? null,
        phone: place.nationalPhoneNumber ?? null,
        roadAddress: place.formattedAddress ?? null,
        address: place.formattedAddress ?? null,
        url: place.googleMapsUri ?? null,
        lat: parseFiniteNumber(place.location?.latitude),
        lng: parseFiniteNumber(place.location?.longitude),
        googlePlaceResourceName: place.name ?? null,
        googleRating: parseFiniteNumber(place.rating),
        googleUserRatingCount: parseInteger(place.userRatingCount),
        googlePhotoName: primaryPhoto?.name ?? null,
        googlePhotoAuthorName: primaryPhotoAuthor?.displayName ?? null,
        googlePhotoAuthorUri: primaryPhotoAuthor?.uri ?? null,
        googleOpeningHours: place.regularOpeningHours?.weekdayDescriptions ?? null,
        googleEditorialSummary: place.editorialSummary?.text ?? null,
        googleWebsiteUri: place.websiteUri ?? null,
      };
      const assessment = calculateBusinessMatchScoreDetailed(
        { name: target.name, address: target.address, category: target.category, lat: target.lat, lng: target.lng },
        candidate,
      );
      return { ...candidate, score: assessment.score, autoApplicable: assessment.autoApplicable };
    });

    const selected = candidates
      .filter((candidate) => candidate.autoApplicable)
      .sort((left, right) => Number(Boolean(right.googlePhotoName)) - Number(Boolean(left.googlePhotoName)) || right.score - left.score)[0];

    return selected ? toEntry(target, selected) : null;
  } catch {
    return null;
  }
}