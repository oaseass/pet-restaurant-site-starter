import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PlaceCategory, Prisma, SourceType } from "@prisma/client";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { buildAdminLoginPath, canPerformAdminAction, formatAdminRoles, requireAdminPageAccess } from "@/lib/admin-auth";
import { extractDong, extractSido, extractSigungu, normalizeAddress, normalizeText } from "@/lib/address";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "장소 관리 | 댕냥지도 관리자",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PLACE_STATUS_FILTERS = ["ACTIVE", "INACTIVE", "ALL"] as const;
const VERIFIED_FILTERS = ["ALL", "VERIFIED", "UNVERIFIED"] as const;

type AdminPlacesSearchParams = {
  secret?: string;
  q?: string;
  category?: string;
  sourceType?: string;
  status?: string;
  verified?: string;
  notice?: string;
  noticeTone?: string;
};

export default async function AdminPlacesPage({ searchParams }: { searchParams: Promise<AdminPlacesSearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const secret = resolvedSearchParams.secret;
  const query = String(resolvedSearchParams.q ?? "").trim();
  const categoryFilter = getFilterValue(resolvedSearchParams.category, ["ALL", ...Object.values(PlaceCategory)], "ALL");
  const sourceTypeFilter = getFilterValue(resolvedSearchParams.sourceType, ["ALL", ...Object.values(SourceType)], "ALL");
  const statusFilter = getFilterValue(resolvedSearchParams.status, PLACE_STATUS_FILTERS, "ACTIVE");
  const verifiedFilter = getFilterValue(resolvedSearchParams.verified, VERIFIED_FILTERS, "ALL");
  const returnTo = buildAdminPlacesPath({
    secret,
    q: query,
    category: categoryFilter,
    sourceType: sourceTypeFilter,
    status: statusFilter,
    verified: verifiedFilter,
  });

  const access = await requireAdminPageAccess({
    secret,
    requiredRoles: ["SUPER_ADMIN", "OPERATIONS_ADMIN"],
    returnTo,
  });

  async function savePlace(formData: FormData) {
    "use server";

    const submittedSecret = String(formData.get("secret") ?? "");
    const placeId = String(formData.get("placeId") ?? "");
    const safeReturnTo = getSafeReturnTo(String(formData.get("returnTo") ?? ""), submittedSecret);

    if (!placeId || !(await canPerformAdminAction({ secret: submittedSecret, requiredRoles: ["SUPER_ADMIN", "OPERATIONS_ADMIN"] }))) {
      redirect(buildAdminLoginPath(safeReturnTo));
    }

    const category = String(formData.get("category") ?? "");
    if (!Object.values(PlaceCategory).includes(category as PlaceCategory)) {
      redirect(appendNoticeToPath(safeReturnTo, "error", "지원하지 않는 카테고리입니다."));
    }

    const name = normalizeText(String(formData.get("name") ?? ""));
    if (!name) {
      redirect(appendNoticeToPath(safeReturnTo, "error", "장소명은 비워둘 수 없습니다."));
    }

    const address = parseNullableAddress(formData.get("address"));
    const roadAddress = parseNullableAddress(formData.get("roadAddress"));
    const phone = parseNullableText(formData.get("phone"));
    const businessStatus = parseNullableText(formData.get("businessStatus"));
    const lat = parseNullableNumber(formData.get("lat"));
    const lng = parseNullableNumber(formData.get("lng"));
    const description = parseNullableText(formData.get("description"));
    const openingHours = parseNullableText(formData.get("openingHours"));
    const priceText = parseNullableText(formData.get("priceText"));
    const reservationUrl = parseNullableText(formData.get("reservationUrl"));
    const serviceTags = parseStringArray(formData.get("serviceTags"));
    const isActive = formData.get("isActive") === "on";
    const ownerVerified = formData.get("ownerVerified") === "on";
    const parkingAvailable = formData.get("parkingAvailable") === "on";
    const largeDogAllowed = formData.get("largeDogAllowed") === "on";
    const catAllowed = formData.get("catAllowed") === "on";
    const indoorAllowed = formData.get("indoorAllowed") === "on";
    const outdoorAllowed = formData.get("outdoorAllowed") === "on";
    const leashRequired = formData.get("leashRequired") === "on";
    const cageRequired = formData.get("cageRequired") === "on";
    const regionBase = roadAddress || address;

    await prisma.place.update({
      where: { id: placeId },
      data: {
        category: category as PlaceCategory,
        name,
        normalizedName: normalizeText(name).toLowerCase(),
        address,
        roadAddress,
        phone,
        lat,
        lng,
        businessStatus,
        sido: regionBase ? extractSido(regionBase) : null,
        sigungu: regionBase ? extractSigungu(regionBase) ?? null : null,
        eupmyeondong: regionBase ? extractDong(regionBase) ?? null : null,
        ownerVerified,
        isActive,
        updatedAt: new Date(),
      },
    });

    await prisma.placeProfile.upsert({
      where: { placeId },
      update: {
        description,
        openingHours,
        priceText,
        reservationUrl,
        serviceTags: serviceTags === undefined ? undefined : serviceTags.length > 0 ? serviceTags : Prisma.DbNull,
        parkingAvailable,
        largeDogAllowed,
        catAllowed,
        indoorAllowed,
        outdoorAllowed,
        leashRequired,
        cageRequired,
        ownerUpdatedAt: new Date(),
      },
      create: {
        placeId,
        description,
        openingHours,
        priceText,
        reservationUrl,
        serviceTags: serviceTags.length > 0 ? serviceTags : Prisma.DbNull,
        parkingAvailable,
        largeDogAllowed,
        catAllowed,
        indoorAllowed,
        outdoorAllowed,
        leashRequired,
        cageRequired,
        ownerUpdatedAt: new Date(),
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/places");
    revalidatePath("/search");
    revalidatePath("/places");

    redirect(appendNoticeToPath(safeReturnTo, "success", `${name} 정보를 저장했습니다.`));
  }

  const where: Prisma.PlaceWhereInput = {
    ...(categoryFilter !== "ALL" ? { category: categoryFilter as PlaceCategory } : {}),
    ...(sourceTypeFilter !== "ALL" ? { sourceType: sourceTypeFilter as SourceType } : {}),
    ...(statusFilter === "ACTIVE" ? { isActive: true } : statusFilter === "INACTIVE" ? { isActive: false } : {}),
    ...(verifiedFilter === "VERIFIED" ? { ownerVerified: true } : verifiedFilter === "UNVERIFIED" ? { ownerVerified: false } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { address: { contains: query, mode: "insensitive" } },
            { roadAddress: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
            { sourceId: { contains: query, mode: "insensitive" } },
            { businessStatus: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [activePlaceCount, manualPlaceCount, verifiedPlaceCount, places] = await Promise.all([
    prisma.place.count({ where: { isActive: true } }),
    prisma.place.count({ where: { sourceType: "MANUAL_DATA", isActive: true } }),
    prisma.place.count({ where: { ownerVerified: true, isActive: true } }),
    prisma.place.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
      take: 18,
      include: {
        profile: true,
        _count: {
          select: {
            businessClaims: true,
            priceReports: true,
          },
        },
      },
    }),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-4xl">
            <p className="eyebrow">Admin Places</p>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">장소 목록을 검색하고, 실제 운영 필드를 바로 수정합니다.</h1>
            <p className="mt-4 text-sm leading-8 text-[#655a53] sm:text-base">요즘 운영툴 방식에 맞춰 목록 안에서 바로 수정하는 흐름으로 구성했습니다. 장소명, 카테고리, 주소, 노출 상태, 업체 인증, 프로필 정보까지 한 번에 저장됩니다.</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-black text-[#6d6259]">
              <span className="badge">{access.method === "session" ? `세션 ${access.email}` : "비상 secret 접근"}</span>
              <span className="badge">{formatAdminRoles(access.roles)}</span>
              <span className="badge">활성 장소 {activePlaceCount.toLocaleString("ko-KR")}</span>
              <span className="badge">수동 데이터 {manualPlaceCount.toLocaleString("ko-KR")}</span>
              <span className="badge">업체 인증 {verifiedPlaceCount.toLocaleString("ko-KR")}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href={withSecret("/admin", secret)} className="btn-secondary">관리자 허브</a>
            <a href={withSecret("/api/admin/manual-place-template", secret)} className="btn-secondary">업로드 양식</a>
            {access.method === "session" ? <AdminSignOutButton /> : null}
          </div>
        </div>
      </section>

      {resolvedSearchParams.notice ? (
        <section className={`mt-6 rounded-[1.8rem] border px-5 py-4 text-sm ${resolvedSearchParams.noticeTone === "success" ? "border-[rgba(31,74,64,0.16)] bg-[rgba(220,236,229,0.72)] text-[#1f4a40]" : "border-[rgba(177,63,63,0.16)] bg-[#fff4f1] text-[#9d4639]"}`.trim()}>
          {resolvedSearchParams.notice}
        </section>
      ) : null}

      <section className="mt-6 card rounded-[2rem] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">검색과 필터</h2>
            <p className="mt-2 text-sm leading-7 text-[#665950]">업소명, 주소, 전화번호, sourceId로 검색하고 카테고리/출처/활성 상태를 좁힐 수 있습니다.</p>
          </div>
          <a href={withSecret("/admin/places", secret)} className="btn-secondary">필터 초기화</a>
        </div>
        <form method="GET" className="mt-5 grid gap-3 xl:grid-cols-[1.5fr_repeat(4,minmax(0,0.7fr))_auto]">
          <input type="hidden" name="secret" value={secret} />
          <label className="flex flex-col gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#9d8e82]">
            Search
            <input type="search" name="q" defaultValue={query} placeholder="이름, 주소, 전화번호, sourceId" className="rounded-[1.2rem] border border-[rgba(56,41,29,0.1)] bg-white px-4 py-3 text-sm font-semibold tracking-normal text-[#2b211b] outline-none placeholder:text-[#9d8e82]" />
          </label>
          <FilterSelect name="category" label="카테고리" value={categoryFilter} options={["ALL", ...Object.values(PlaceCategory)]} />
          <FilterSelect name="sourceType" label="출처" value={sourceTypeFilter} options={["ALL", ...Object.values(SourceType)]} />
          <FilterSelect name="status" label="상태" value={statusFilter} options={[...PLACE_STATUS_FILTERS]} />
          <FilterSelect name="verified" label="업체 인증" value={verifiedFilter} options={[...VERIFIED_FILTERS]} />
          <button type="submit" className="btn-primary min-h-0 px-5 py-3 lg:self-end">적용</button>
        </form>
      </section>

      <section className="mt-6 space-y-4">
        {places.length > 0 ? places.map((place) => (
          <article key={place.id} className="card rounded-[2rem] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="badge">{place.category}</span>
                  <span className="badge">{place.sourceType}</span>
                  <span className="badge">{place.isActive ? "활성" : "비활성"}</span>
                  {place.ownerVerified ? <span className="badge">업체 인증</span> : null}
                </div>
                <h2 className="mt-4 text-2xl font-black">{place.name}</h2>
                <p className="mt-2 text-sm leading-7 text-[#665950]">{place.address ?? place.roadAddress ?? "주소 없음"}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-[#6f6257]">
                  <span className="badge">sourceId {place.sourceId ?? "-"}</span>
                  <span className="badge">제보 {place._count.priceReports}건</span>
                  <span className="badge">업체 요청 {place._count.businessClaims}건</span>
                  <span className="badge">수정 {place.updatedAt.toLocaleString("ko-KR")}</span>
                </div>
              </div>
            </div>

            <form action={savePlace} className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <input type="hidden" name="secret" value={secret} />
              <input type="hidden" name="placeId" value={place.id} />
              <input type="hidden" name="returnTo" value={returnTo} />

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name="name" label="장소명" defaultValue={place.name} required />
                <SelectField name="category" label="카테고리" defaultValue={place.category} options={Object.values(PlaceCategory)} />
                <TextField name="address" label="대표 주소" defaultValue={place.address ?? ""} />
                <TextField name="roadAddress" label="도로명 주소" defaultValue={place.roadAddress ?? ""} />
                <TextField name="phone" label="전화번호" defaultValue={place.phone ?? ""} />
                <TextField name="businessStatus" label="운영상태" defaultValue={place.businessStatus ?? ""} />
                <TextField name="lat" label="위도" defaultValue={place.lat?.toString() ?? ""} inputMode="decimal" />
                <TextField name="lng" label="경도" defaultValue={place.lng?.toString() ?? ""} inputMode="decimal" />
                <TextAreaField name="description" label="설명" defaultValue={place.profile?.description ?? ""} className="sm:col-span-2" />
                <TextAreaField name="openingHours" label="운영시간" defaultValue={place.profile?.openingHours ?? ""} className="sm:col-span-2" />
                <TextAreaField name="priceText" label="가격 메모" defaultValue={place.profile?.priceText ?? ""} className="sm:col-span-2" />
                <TextField name="reservationUrl" label="예약 URL" defaultValue={place.profile?.reservationUrl ?? ""} className="sm:col-span-2" />
                <TextField name="serviceTags" label="서비스 태그" defaultValue={Array.isArray(place.profile?.serviceTags) ? place.profile?.serviceTags.join(", ") : ""} className="sm:col-span-2" />
              </div>

              <div className="rounded-[1.6rem] border border-[rgba(56,41,29,0.08)] bg-white/70 p-5">
                <h3 className="text-lg font-black">노출/정책 토글</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <ToggleField name="isActive" label="활성 노출" defaultChecked={place.isActive} />
                  <ToggleField name="ownerVerified" label="업체 인증" defaultChecked={place.ownerVerified} />
                  <ToggleField name="parkingAvailable" label="주차 가능" defaultChecked={Boolean(place.profile?.parkingAvailable)} />
                  <ToggleField name="largeDogAllowed" label="대형견 가능" defaultChecked={Boolean(place.profile?.largeDogAllowed)} />
                  <ToggleField name="catAllowed" label="고양이 가능" defaultChecked={Boolean(place.profile?.catAllowed)} />
                  <ToggleField name="indoorAllowed" label="실내 가능" defaultChecked={Boolean(place.profile?.indoorAllowed)} />
                  <ToggleField name="outdoorAllowed" label="실외 가능" defaultChecked={Boolean(place.profile?.outdoorAllowed)} />
                  <ToggleField name="leashRequired" label="리드줄 필수" defaultChecked={Boolean(place.profile?.leashRequired)} />
                  <ToggleField name="cageRequired" label="케이지 필수" defaultChecked={Boolean(place.profile?.cageRequired)} />
                </div>
                <div className="mt-5 rounded-[1.4rem] bg-[#f7f1ea] p-4 text-sm leading-7 text-[#5f5550]">
                  <p className="font-black text-[#2b211b]">주의</p>
                  <p className="mt-2">공식 데이터 행이라도 여기서 수정한 값은 현재 운영 우선값으로 저장됩니다. 다만 향후 원천 동기화를 다시 켜면 sourceType이 OFFICIAL_DATA 인 일부 필드는 재동기화 정책에 따라 덮어써질 수 있습니다.</p>
                </div>
                <button type="submit" className="btn-primary mt-5 w-full">장소 정보 저장</button>
              </div>
            </form>
          </article>
        )) : <div className="card rounded-[2rem] p-6 text-sm leading-7 text-[#665950]">조건에 맞는 장소가 없습니다.</div>}
      </section>
    </main>
  );
}

function getFilterValue<T extends readonly string[]>(value: string | undefined, allowed: T, fallback: T[number]) {
  if (!value) return fallback;
  return allowed.includes(value as T[number]) ? value as T[number] : fallback;
}

function parseNullableAddress(value: FormDataEntryValue | null) {
  const text = normalizeText(String(value ?? ""));
  return text ? normalizeAddress(text) : null;
}

function parseNullableText(value: FormDataEntryValue | null) {
  const text = normalizeText(String(value ?? ""));
  return text ? text : null;
}

function parseNullableNumber(value: FormDataEntryValue | null) {
  const text = normalizeText(String(value ?? ""));
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseStringArray(value: FormDataEntryValue | null) {
  const text = normalizeText(String(value ?? ""));
  if (!text) return [];
  return text.split(",").map((item) => normalizeText(item)).filter(Boolean);
}

function buildAdminPlacesPath({
  secret,
  q,
  category,
  sourceType,
  status,
  verified,
}: {
  secret?: string;
  q?: string;
  category?: string;
  sourceType?: string;
  status?: string;
  verified?: string;
}) {
  const params = new URLSearchParams();
  if (secret) params.set("secret", secret);
  if (q) params.set("q", q);
  if (category && category !== "ALL") params.set("category", category);
  if (sourceType && sourceType !== "ALL") params.set("sourceType", sourceType);
  if (status && status !== "ACTIVE") params.set("status", status);
  if (verified && verified !== "ALL") params.set("verified", verified);
  const queryString = params.toString();
  return queryString ? `/admin/places?${queryString}` : "/admin/places";
}

function appendNoticeToPath(path: string, tone: "success" | "error", message: string) {
  const url = new URL(path, "http://localhost:3000");
  url.searchParams.set("noticeTone", tone);
  url.searchParams.set("notice", message);
  return `${url.pathname}?${url.searchParams.toString()}`;
}

function getSafeReturnTo(value: string, secret?: string) {
  if (value.startsWith("/admin/places")) {
    return value;
  }
  return buildAdminPlacesPath({ secret });
}

function withSecret(path: string, secret?: string) {
  if (!secret) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}secret=${encodeURIComponent(secret)}`;
}

function FilterSelect({ name, label, value, options }: { name: string; label: string; value: string; options: readonly string[] }) {
  return (
    <label className="flex flex-col gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#9d8e82]">
      {label}
      <select name={name} defaultValue={value} className="rounded-[1.2rem] border border-[rgba(56,41,29,0.1)] bg-white px-4 py-3 text-sm font-semibold tracking-normal text-[#2b211b] outline-none">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function TextField({ name, label, defaultValue, className, required, inputMode }: { name: string; label: string; defaultValue: string; className?: string; required?: boolean; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"] }) {
  return (
    <label className={`flex flex-col gap-2 text-sm font-black text-[#4b423c] ${className ?? ""}`.trim()}>
      {label}
      <input name={name} defaultValue={defaultValue} required={required} inputMode={inputMode} className="rounded-[1.2rem] border border-[rgba(56,41,29,0.12)] bg-white px-4 py-3 text-sm font-semibold text-[#2b211b] outline-none" />
    </label>
  );
}

function TextAreaField({ name, label, defaultValue, className }: { name: string; label: string; defaultValue: string; className?: string }) {
  return (
    <label className={`flex flex-col gap-2 text-sm font-black text-[#4b423c] ${className ?? ""}`.trim()}>
      {label}
      <textarea name={name} defaultValue={defaultValue} className="min-h-28 rounded-[1.2rem] border border-[rgba(56,41,29,0.12)] bg-white px-4 py-3 text-sm font-semibold text-[#2b211b] outline-none" />
    </label>
  );
}

function SelectField({ name, label, defaultValue, options }: { name: string; label: string; defaultValue: string; options: string[] }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-black text-[#4b423c]">
      {label}
      <select name={name} defaultValue={defaultValue} className="rounded-[1.2rem] border border-[rgba(56,41,29,0.12)] bg-white px-4 py-3 text-sm font-semibold text-[#2b211b] outline-none">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function ToggleField({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-[1.2rem] border border-[rgba(56,41,29,0.08)] bg-[#fffdfa] px-4 py-3 text-sm font-black text-[#2b211b]">
      <span>{label}</span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-[var(--brand)]" />
    </label>
  );
}