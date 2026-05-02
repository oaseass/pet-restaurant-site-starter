import type { PlaceSourceEntry } from "@/lib/place-source-registry";

export type PlaceSourceFetchResult =
  | { ok: true; buffer: Buffer; contentType: string; sourceUrl: string }
  | { ok: false; error: string; status?: number; requiresManualUpload: true; sourceUrl: string };

const FETCH_TIMEOUT_MS = 15_000;

/**
 * 공식 공공데이터 원천에서 파일을 한 번만 가져옵니다.
 * 실패 시 재시도하지 않고 즉시 수동 업로드 필요 상태를 반환합니다.
 */
export async function fetchOfficialPlaceSource(entry: PlaceSourceEntry): Promise<PlaceSourceFetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(entry.sourceUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "DaengnYangMap/1.0 (official public data import; +https://daengnyang.vercel.app)",
        Accept: "text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (response.status === 403 || response.status === 401) {
      return {
        ok: false,
        error: `공식 원천 접근 거부됨 (${response.status}). 데이터 포털에서 직접 파일을 내려받아 수동 업로드해 주세요.`,
        status: response.status,
        requiresManualUpload: true,
        sourceUrl: entry.sourceUrl,
      };
    }

    if (response.status === 429) {
      return {
        ok: false,
        error: "공식 원천 요청 한도 초과 (429). 잠시 후 다시 시도하거나 수동 업로드를 사용하세요.",
        status: 429,
        requiresManualUpload: true,
        sourceUrl: entry.sourceUrl,
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: `공식 원천 응답 오류 (${response.status} ${response.statusText}). 수동 업로드를 사용하세요.`,
        status: response.status,
        requiresManualUpload: true,
        sourceUrl: entry.sourceUrl,
      };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0) {
      return {
        ok: false,
        error: "응답은 성공했지만 파일이 비어 있습니다. 수동 업로드를 사용하세요.",
        requiresManualUpload: true,
        sourceUrl: entry.sourceUrl,
      };
    }

    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    return { ok: true, buffer, contentType, sourceUrl: entry.sourceUrl };
  } catch (error) {
    clearTimeout(timeout);
    const isTimeout = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      error: isTimeout
        ? `공식 원천 요청 시간 초과 (${FETCH_TIMEOUT_MS / 1000}초). 수동 업로드를 사용하세요.`
        : `공식 원천 연결 실패: ${error instanceof Error ? error.message : String(error)}. 수동 업로드를 사용하세요.`,
      requiresManualUpload: true,
      sourceUrl: entry.sourceUrl,
    };
  }
}
