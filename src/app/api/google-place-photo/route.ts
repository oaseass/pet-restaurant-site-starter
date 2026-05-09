import { NextRequest, NextResponse } from "next/server";

function getGooglePlacesApiKey() {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || null;
}

function parsePixel(value: string | null, fallback: number) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue)) return fallback;
  return Math.min(Math.max(numberValue, 120), 1600);
}

function buildPhotoMediaUrl(photoName: string, maxWidthPx: number, maxHeightPx: number) {
  const resourcePath = photoName.split("/").map(encodeURIComponent).join("/");
  const url = new URL(`https://places.googleapis.com/v1/${resourcePath}/media`);
  url.searchParams.set("maxWidthPx", String(maxWidthPx));
  url.searchParams.set("maxHeightPx", String(maxHeightPx));
  url.searchParams.set("skipHttpRedirect", "true");
  return url;
}

export async function GET(request: NextRequest) {
  const apiKey = getGooglePlacesApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "Google Places API key is not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const photoName = searchParams.get("name")?.trim() ?? "";
  if (!photoName.startsWith("places/") || !photoName.includes("/photos/")) {
    return NextResponse.json({ error: "Invalid Google photo resource name." }, { status: 400 });
  }

  const maxWidthPx = parsePixel(searchParams.get("maxWidthPx"), 960);
  const maxHeightPx = parsePixel(searchParams.get("maxHeightPx"), 540);
  const response = await fetch(buildPhotoMediaUrl(photoName, maxWidthPx, maxHeightPx), {
    headers: { "X-Goog-Api-Key": apiKey },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 60 * 60 * 12 },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Google photo request failed." }, { status: response.status });
  }

  const payload = await response.json() as { photoUri?: string };
  if (!payload.photoUri) {
    return NextResponse.json({ error: "Google photo URI was not returned." }, { status: 502 });
  }

  const redirect = NextResponse.redirect(payload.photoUri, 307);
  redirect.headers.set("Cache-Control", "public, max-age=43200, stale-while-revalidate=86400");
  return redirect;
}