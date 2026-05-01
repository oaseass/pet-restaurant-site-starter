"use client";

import { useState } from "react";
import type { PlaceCategory } from "@prisma/client";

type PreviewRow = {
  rowNumber: number;
  sourceId: string;
  category: PlaceCategory;
  name: string;
  address: string | null;
  roadAddress: string | null;
  phone: string | null;
  businessStatus: string | null;
  action: "CREATE" | "UPDATE";
};

type ImportRow = {
  rowNumber: number;
  sourceId: string;
  category: PlaceCategory;
  name: string;
  normalizedName: string;
  address?: string | null;
  roadAddress?: string | null;
  phone?: string | null;
  lat?: number | null;
  lng?: number | null;
  isActive?: boolean | null;
  ownerVerified?: boolean | null;
  businessStatus?: string | null;
  description?: string | null;
  openingHours?: string | null;
  priceText?: string | null;
  reservationUrl?: string | null;
  serviceTags?: string[] | null;
  parkingAvailable?: boolean | null;
  largeDogAllowed?: boolean | null;
  catAllowed?: boolean | null;
  indoorAllowed?: boolean | null;
  outdoorAllowed?: boolean | null;
  leashRequired?: boolean | null;
  cageRequired?: boolean | null;
};

type PreviewPayload = {
  totalRows: number;
  addedCount: number;
  updatedCount: number;
  categories: PlaceCategory[];
  rows: ImportRow[];
  previewRows: PreviewRow[];
  approvalToken: string;
};

const CATEGORY_OPTIONS = ["", "ANIMAL_HOSPITAL", "GROOMING", "DAYCARE", "FUNERAL"] as const;

export function AdminImportWorkbench({
  previewEndpoint,
  applyEndpoint,
  templateHref,
}: {
  previewEndpoint: string;
  applyEndpoint: string;
  templateHref: string;
}) {
  const [targetCategory, setTargetCategory] = useState<(typeof CATEGORY_OPTIONS)[number]>("");
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  async function handlePreviewSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    setIsPreviewing(true);
    setErrorMessage("");
    setSuccessMessage("");
    setPreview(null);

    try {
      const response = await fetch(previewEndpoint, {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "미리보기를 생성하지 못했습니다.");
      }

      setPreview(payload.preview as PreviewPayload);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsPreviewing(false);
    }
  }

  async function handleApplyClick() {
    if (!preview) return;

    setIsApplying(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(applyEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rows: preview.rows,
          approvalToken: preview.approvalToken,
          targetCategory: targetCategory || null,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "승인 반영에 실패했습니다.");
      }

      setSuccessMessage(`총 ${payload.result.totalRows}행을 반영했습니다. 신규 ${payload.result.addedCount}건, 수정 ${payload.result.updatedCount}건입니다.`);
      setPreview(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <section className="card rounded-[2rem] p-6">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9d8e82]">Import Upload</p>
        <h2 className="mt-3 text-2xl font-black">XLSX/CSV 업로드 후 staging preview 생성</h2>
        <p className="mt-3 text-sm leading-7 text-[#665950]">파일을 올리면 먼저 preview만 생성합니다. preview를 검토한 뒤 승인 버튼을 눌러야 places에 반영됩니다.</p>

        <form onSubmit={handlePreviewSubmit} className="mt-5 space-y-4">
          <label className="block text-sm font-black text-[#4b423c]">
            대상 카테고리
            <select
              value={targetCategory}
              onChange={(event) => setTargetCategory(event.target.value as (typeof CATEGORY_OPTIONS)[number])}
              name="targetCategory"
              className="mt-2 block w-full rounded-[1.2rem] border border-[rgba(56,41,29,0.12)] bg-white px-4 py-3 text-sm"
            >
              <option value="">파일 기준 자동 판별</option>
              <option value="ANIMAL_HOSPITAL">ANIMAL_HOSPITAL</option>
              <option value="GROOMING">GROOMING</option>
              <option value="DAYCARE">DAYCARE</option>
              <option value="FUNERAL">FUNERAL</option>
            </select>
          </label>

          <label className="block text-sm font-black text-[#4b423c]">
            업로드 파일
            <input
              type="file"
              name="file"
              accept=".xlsx,.xls,.csv"
              className="mt-2 block w-full rounded-[1.2rem] border border-[rgba(56,41,29,0.12)] bg-white px-4 py-4 text-sm"
              required
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="btn-primary" disabled={isPreviewing}>{isPreviewing ? "preview 생성 중..." : "preview 만들기"}</button>
            <a href={templateHref} className="btn-secondary">템플릿 다운로드</a>
          </div>
        </form>

        {errorMessage ? <p className="mt-4 rounded-[1.2rem] border border-[rgba(177,63,63,0.16)] bg-[#fff4f1] px-4 py-3 text-sm font-semibold text-[#9d4639]">{errorMessage}</p> : null}
        {successMessage ? <p className="mt-4 rounded-[1.2rem] border border-[rgba(31,74,64,0.16)] bg-[rgba(220,236,229,0.72)] px-4 py-3 text-sm font-semibold text-[#1f4a40]">{successMessage}</p> : null}

        <div className="mt-5 rounded-[1.4rem] bg-[#f7f1ea] p-4 text-sm leading-7 text-[#5f5550]">
          <p className="font-black text-[#2b211b]">지원 카테고리</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-[#6d6259]">
            <span className="badge">ANIMAL_HOSPITAL</span>
            <span className="badge">GROOMING</span>
            <span className="badge">DAYCARE</span>
            <span className="badge">FUNERAL</span>
          </div>
        </div>
      </section>

      <section className="card rounded-[2rem] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9d8e82]">Preview Queue</p>
            <h2 className="mt-3 text-2xl font-black">승인 전 미리보기</h2>
          </div>
          {preview ? <button type="button" className="btn-primary" onClick={handleApplyClick} disabled={isApplying}>{isApplying ? "승인 반영 중..." : "승인 후 반영"}</button> : null}
        </div>

        {preview ? (
          <>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-[#6d6259]">
              <span className="badge">행 {preview.totalRows}</span>
              <span className="badge">신규 {preview.addedCount}</span>
              <span className="badge">수정 {preview.updatedCount}</span>
              {preview.categories.map((category) => <span key={category} className="badge">{category}</span>)}
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[rgba(56,41,29,0.08)] text-xs font-black uppercase tracking-[0.18em] text-[#9d8e82]">
                    <th className="px-3 py-3">행</th>
                    <th className="px-3 py-3">작업</th>
                    <th className="px-3 py-3">카테고리</th>
                    <th className="px-3 py-3">이름</th>
                    <th className="px-3 py-3">주소</th>
                    <th className="px-3 py-3">전화</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.previewRows.map((row) => (
                    <tr key={`${row.sourceId}-${row.rowNumber}`} className="border-b border-[rgba(56,41,29,0.05)] align-top last:border-b-0">
                      <td className="px-3 py-3 font-black text-[#2b211b]">{row.rowNumber}</td>
                      <td className="px-3 py-3"><span className="badge">{row.action}</span></td>
                      <td className="px-3 py-3 text-[#5f5550]">{row.category}</td>
                      <td className="px-3 py-3 font-semibold text-[#2b211b]">{row.name}</td>
                      <td className="px-3 py-3 leading-7 text-[#665950]">{row.roadAddress ?? row.address ?? "-"}</td>
                      <td className="px-3 py-3 text-[#665950]">{row.phone ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-[1.5rem] border border-dashed border-[rgba(56,41,29,0.12)] bg-[#fffdfa] px-5 py-8 text-sm leading-7 text-[#665950]">
            아직 preview가 없습니다. 파일을 올려 preview를 만든 뒤, 신규/수정 대상을 확인하고 승인 반영하세요.
          </div>
        )}
      </section>
    </div>
  );
}