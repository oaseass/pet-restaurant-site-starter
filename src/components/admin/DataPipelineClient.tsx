"use client";

import { useState } from "react";
import { AdminImportWorkbench } from "@/components/admin/AdminImportWorkbench";

type StepStatus = "idle" | "running" | "success" | "error";

type SyncResult = {
  ok: boolean;
  message?: string;
  added?: number;
  updated?: number;
  skipped?: number;
  total?: number;
  mode?: string;
};

type GeocodeResult = {
  ok: boolean;
  message?: string;
  selectedCount?: number;
  resolvedCount?: number;
  updatedCount?: number;
  failedCount?: number;
  apiRequestCount?: number;
  providerConfigured?: boolean;
};

type SnapshotResult = {
  ok: boolean;
  message?: string;
  mode?: "deploy-hook" | "direct-write";
  restaurantCount?: number;
  mapPointCount?: number;
  regionsBySido?: number;
  deployHookTriggered?: boolean;
};

type Props = {
  secret?: string;
  pendingGeocodeCount: number;
};

function withSecret(path: string, secret?: string) {
  if (!secret) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}secret=${encodeURIComponent(secret)}`;
}

export function DataPipelineClient({ secret, pendingGeocodeCount }: Props) {
  const [syncStatus, setSyncStatus] = useState<StepStatus>("idle");
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  const [geocodeStatus, setGeocodeStatus] = useState<StepStatus>("idle");
  const [geocodeResult, setGeocodeResult] = useState<GeocodeResult | null>(null);

  const [snapshotStatus, setSnapshotStatus] = useState<StepStatus>("idle");
  const [snapshotResult, setSnapshotResult] = useState<SnapshotResult | null>(null);

  async function handleSync() {
    setSyncStatus("running");
    setSyncResult(null);
    setShowFallback(false);
    try {
      const response = await fetch(withSecret("/api/admin/data-pipeline/sync", secret), { method: "POST" });
      const data = await response.json() as SyncResult;
      setSyncResult(data);
      if (data.ok) {
        setSyncStatus("success");
      } else {
        setSyncStatus("error");
        setShowFallback(true);
      }
    } catch (error) {
      setSyncResult({ ok: false, message: error instanceof Error ? error.message : "네트워크 오류" });
      setSyncStatus("error");
      setShowFallback(true);
    }
  }

  async function handleGeocode() {
    setGeocodeStatus("running");
    setGeocodeResult(null);
    try {
      const response = await fetch(withSecret("/api/admin/data-pipeline/geocode", secret), { method: "POST" });
      const data = await response.json() as GeocodeResult;
      setGeocodeResult(data);
      setGeocodeStatus(data.ok ? "success" : "error");
    } catch (error) {
      setGeocodeResult({ ok: false, message: error instanceof Error ? error.message : "네트워크 오류" });
      setGeocodeStatus("error");
    }
  }

  async function handleSnapshot() {
    setSnapshotStatus("running");
    setSnapshotResult(null);
    try {
      const response = await fetch(withSecret("/api/admin/data-pipeline/snapshot", secret), { method: "POST" });
      const data = await response.json() as SnapshotResult;
      setSnapshotResult(data);
      setSnapshotStatus(data.ok ? "success" : "error");
    } catch (error) {
      setSnapshotResult({ ok: false, message: error instanceof Error ? error.message : "네트워크 오류" });
      setSnapshotStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Step 1: 공식 데이터 동기화 */}
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Step 1</p>
            <h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">공식 데이터 가져오기</h2>
            <p className="mt-1 text-sm text-[#655a53]">식품안전나라에서 반려동물 동반 식당 목록을 가져와 Restaurant + Place 테이블에 저장합니다.</p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncStatus === "running"}
            className="btn-primary shrink-0 disabled:opacity-50"
          >
            {syncStatus === "running" ? "가져오는 중…" : "데이터 가져오기"}
          </button>
        </div>

        {syncResult && (
          <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${syncResult.ok ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
            {syncResult.ok ? (
              <p>
                ✓ 동기화 완료 — 신규 <strong>{syncResult.added ?? 0}</strong>건,
                갱신 <strong>{syncResult.updated ?? 0}</strong>건,
                스킵 <strong>{syncResult.skipped ?? 0}</strong>건
                (총 <strong>{syncResult.total ?? 0}</strong>건)
              </p>
            ) : (
              <p>✗ 동기화 실패 — {syncResult.message}</p>
            )}
          </div>
        )}

        {syncStatus === "error" && (
          <div className="mt-4">
            <button
              onClick={() => setShowFallback((v) => !v)}
              className="btn-secondary text-sm"
            >
              {showFallback ? "수동 업로드 숨기기" : "수동 파일 업로드로 대체하기"}
            </button>
          </div>
        )}
      </section>

      {/* Step 1 Fallback: 수동 XLSX/CSV 업로드 */}
      {showFallback && (
        <section className="section-shell border-2 border-orange-200 px-6 py-6 sm:px-8 sm:py-8">
          <p className="eyebrow text-orange-600">Step 1 — Fallback</p>
          <h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">수동 파일 업로드</h2>
          <p className="mt-1 text-sm text-[#655a53]">
            식품안전나라 연결 실패 시 직접 내려받은 XLSX/CSV 파일을 업로드합니다. 카테고리는{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">PET_RESTAURANT</code>로 설정하세요.
          </p>
          <div className="mt-5">
            <AdminImportWorkbench
              previewEndpoint={withSecret("/api/admin/import/preview", secret)}
              applyEndpoint={withSecret("/api/admin/import/apply", secret)}
              templateHref={withSecret("/api/admin/manual-place-template", secret)}
              defaultCategory="PET_RESTAURANT"
            />
          </div>
        </section>
      )}

      {/* Step 2: 좌표 생성 */}
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Step 2</p>
            <h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">카카오 주소 좌표화</h2>
            <p className="mt-1 text-sm text-[#655a53]">
              좌표 미입력 식당을 카카오 Geocoding API로 변환합니다. 한 번에 최대 100건 처리됩니다.
              {pendingGeocodeCount > 0 && (
                <> 현재 미좌표화 <strong>{pendingGeocodeCount}</strong>건.</>
              )}
            </p>
          </div>
          <button
            onClick={handleGeocode}
            disabled={geocodeStatus === "running"}
            className="btn-primary shrink-0 disabled:opacity-50"
          >
            {geocodeStatus === "running" ? "좌표화 중…" : "좌표 일괄 변환"}
          </button>
        </div>

        {geocodeResult && (
          <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${geocodeResult.ok ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
            {geocodeResult.ok ? (
              <p>
                ✓ 좌표화 완료 — 대상 <strong>{geocodeResult.selectedCount ?? 0}</strong>건,
                성공 <strong>{geocodeResult.updatedCount ?? 0}</strong>건,
                실패 <strong>{geocodeResult.failedCount ?? 0}</strong>건
                (API 호출 <strong>{geocodeResult.apiRequestCount ?? 0}</strong>회)
                {geocodeResult.providerConfigured === false && " — KAKAO_REST_API_KEY 미설정"}
              </p>
            ) : (
              <p>✗ 좌표화 실패 — {geocodeResult.message}</p>
            )}
          </div>
        )}
      </section>

      {/* Step 3: 스냅샷 생성 */}
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Step 3</p>
            <h2 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">public/data 스냅샷 갱신</h2>
            <p className="mt-1 text-sm text-[#655a53]">
              DB 데이터를 정적 JSON으로 내보내 지도·검색·목록에 반영합니다.
              Vercel 환경에서는 <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">VERCEL_DEPLOY_HOOK_URL</code>이
              설정된 경우 재빌드를 트리거합니다.
            </p>
          </div>
          <button
            onClick={handleSnapshot}
            disabled={snapshotStatus === "running"}
            className="btn-primary shrink-0 disabled:opacity-50"
          >
            {snapshotStatus === "running" ? "생성 중…" : "스냅샷 내보내기"}
          </button>
        </div>

        {snapshotResult && (
          <div className={`mt-4 rounded-lg border px-4 py-3 text-sm ${snapshotResult.ok ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
            {snapshotResult.ok ? (
              <p>
                ✓ {snapshotResult.message} —
                식당 <strong>{snapshotResult.restaurantCount ?? 0}</strong>건,
                지도핀 <strong>{snapshotResult.mapPointCount ?? 0}</strong>건,
                시도 <strong>{snapshotResult.regionsBySido ?? 0}</strong>개
                {snapshotResult.mode === "deploy-hook" && " (재빌드 트리거됨)"}
              </p>
            ) : (
              <p>✗ 스냅샷 실패 — {snapshotResult.message}</p>
            )}
          </div>
        )}

        {snapshotResult?.ok === false && (
          <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
            <p className="font-semibold">로컬 환경에서 직접 실행하려면:</p>
            <pre className="mt-1 font-mono text-xs">npm run export:public-data</pre>
          </div>
        )}
      </section>
    </div>
  );
}
