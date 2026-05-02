"use client";

import { useState } from "react";

type ImportResult = {
  ok: boolean;
  message?: string;
  label?: string;
  totalParsed?: number;
  skippedByParser?: number;
  totalRows?: number;
  created?: number;
  updated?: number;
  skipped?: number;
  failed?: number;
  errors?: Array<{ row: number; name: string; reason: string }>;
  requiresManualUpload?: boolean;
  sourceUrl?: string;
  dataGoKrId?: string;
  parseFormat?: string;
};

type SourceEntry = {
  category: string;
  label: string;
  syncSource: string;
  dataGoKrId: string;
  sourceUrl: string;
  estimatedCount: number;
  lastSync?: { at: string; created: number; updated: number } | null;
  currentCount: number;
};

type Props = {
  sources: SourceEntry[];
  secret?: string;
};

function withSecret(path: string, secret?: string) {
  if (!secret) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}secret=${encodeURIComponent(secret)}`;
}

function ResultBanner({ result }: { result: ImportResult }) {
  const isSuccess = result.ok && !result.requiresManualUpload;
  const isManualRequired = !result.ok && result.requiresManualUpload;
  const isError = !result.ok && !result.requiresManualUpload;

  return (
    <div
      className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
        isSuccess
          ? "border-green-200 bg-green-50 text-green-800"
          : isManualRequired
            ? "border-orange-200 bg-orange-50 text-orange-800"
            : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {isSuccess && (
        <>
          <p className="font-black">
            ✓ {result.label} 가져오기 완료 — 신규 <strong>{result.created}</strong>건, 갱신{" "}
            <strong>{result.updated}</strong>건, 스킵 <strong>{result.skipped}</strong>건
          </p>
          <p className="mt-1 text-xs opacity-80">
            파싱 {result.totalParsed}행 · {result.parseFormat?.toUpperCase()} 형식
          </p>
        </>
      )}
      {isManualRequired && (
        <>
          <p className="font-black">공식 원천 접근 실패 — 수동 업로드가 필요합니다</p>
          <p className="mt-1">{result.message}</p>
          {result.dataGoKrId && (
            <p className="mt-2 text-xs">
              data.go.kr ID:{" "}
              <a
                href={`https://www.data.go.kr/data/${result.dataGoKrId}/fileData.do`}
                target="_blank"
                rel="noreferrer"
                className="font-black underline"
              >
                {result.dataGoKrId}
              </a>{" "}
              에서 파일을 내려받아 아래 업로드를 사용하세요.
            </p>
          )}
        </>
      )}
      {isError && <p>{result.message}</p>}
      {result.errors && result.errors.length > 0 && (
        <ul className="mt-2 max-h-32 overflow-y-auto space-y-0.5 text-xs">
          {result.errors.slice(0, 10).map((e, i) => (
            <li key={i}>
              행 {e.row}: {e.name} — {e.reason}
            </li>
          ))}
          {result.errors.length > 10 && <li>…외 {result.errors.length - 10}건</li>}
        </ul>
      )}
    </div>
  );
}

function SourceCard({
  source,
  secret,
}: {
  source: SourceEntry;
  secret?: string;
}) {
  const [fetchStatus, setFetchStatus] = useState<"idle" | "running" | "done">("idle");
  const [fetchResult, setFetchResult] = useState<ImportResult | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "running" | "done">("idle");
  const [uploadResult, setUploadResult] = useState<ImportResult | null>(null);

  async function handleFetch() {
    setFetchStatus("running");
    setFetchResult(null);
    try {
      const response = await fetch(withSecret("/api/admin/import-places/source", secret), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: source.category }),
      });
      const data = await response.json() as ImportResult;
      setFetchResult(data);
      if (!data.ok && data.requiresManualUpload) setShowUpload(true);
    } catch (error) {
      setFetchResult({ ok: false, message: error instanceof Error ? error.message : "네트워크 오류" });
    } finally {
      setFetchStatus("done");
    }
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("category", source.category);
    setUploadStatus("running");
    setUploadResult(null);
    try {
      const response = await fetch(withSecret("/api/admin/import-places/upload", secret), {
        method: "POST",
        body: formData,
      });
      const data = await response.json() as ImportResult;
      setUploadResult(data);
    } catch (error) {
      setUploadResult({ ok: false, message: error instanceof Error ? error.message : "네트워크 오류" });
    } finally {
      setUploadStatus("done");
    }
  }

  return (
    <div className="rounded-2xl border border-[rgba(56,41,29,0.1)] bg-white p-5 shadow-sm">
      {/* 헤더 */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge">{source.category}</span>
            <h3 className="text-lg font-black">{source.label}</h3>
          </div>
          <p className="mt-1 text-xs text-[#9d8e82]">
            data.go.kr {source.dataGoKrId} · 예상 약 {source.estimatedCount.toLocaleString("ko-KR")}건
          </p>
          <p className="mt-0.5 text-xs text-[#9d8e82] break-all">{source.sourceUrl}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-[var(--brand)]">{source.currentCount.toLocaleString("ko-KR")}</p>
          <p className="text-xs text-[#9d8e82]">현재 저장된 건수</p>
        </div>
      </div>

      {/* 마지막 동기화 */}
      {source.lastSync && (
        <p className="mt-2 text-xs text-[#9d8e82]">
          마지막 동기화: {new Date(source.lastSync.at).toLocaleString("ko-KR")} —
          신규 {source.lastSync.created}건 / 갱신 {source.lastSync.updated}건
        </p>
      )}

      {/* 액션 버튼 */}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={handleFetch}
          disabled={fetchStatus === "running"}
          className="btn-primary disabled:opacity-50"
        >
          {fetchStatus === "running" ? "가져오는 중…" : "공식 원천에서 가져오기"}
        </button>
        <button
          onClick={() => setShowUpload((v) => !v)}
          className="btn-secondary"
        >
          {showUpload ? "업로드 숨기기" : "수동 파일 업로드"}
        </button>
      </div>

      {/* Fetch 결과 */}
      {fetchResult && <ResultBanner result={fetchResult} />}

      {/* 수동 업로드 폼 */}
      {showUpload && (
        <form onSubmit={handleUpload} className="mt-4 space-y-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-4">
          <p className="text-sm font-black text-orange-800">수동 CSV/XLSX 업로드</p>
          <p className="text-xs text-orange-700">
            data.go.kr ID{" "}
            <a
              href={`https://www.data.go.kr/data/${source.dataGoKrId}/fileData.do`}
              target="_blank"
              rel="noreferrer"
              className="font-black underline"
            >
              {source.dataGoKrId}
            </a>
            에서 파일을 내려받은 후 업로드하세요.
          </p>
          <label className="block">
            <span className="text-xs font-black text-orange-800">CSV / XLSX 파일</span>
            <input
              type="file"
              name="file"
              accept=".csv,.xlsx,.xls"
              required
              className="mt-1 block w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={uploadStatus === "running"}
            className="btn-primary disabled:opacity-50"
          >
            {uploadStatus === "running" ? "업로드 중…" : "업로드 & 반영"}
          </button>
          {uploadResult && <ResultBanner result={uploadResult} />}
        </form>
      )}
    </div>
  );
}

export function ImportPlacesClient({ sources, secret }: Props) {
  return (
    <div className="space-y-4">
      {sources.map((source) => (
        <SourceCard key={source.category} source={source} secret={secret} />
      ))}
    </div>
  );
}
