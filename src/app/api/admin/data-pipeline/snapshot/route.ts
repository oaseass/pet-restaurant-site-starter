import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getAdminAccess } from "@/lib/admin-auth";
import { hasRequiredAdminRole } from "@/lib/admin-access-config";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function generateSnapshotData() {
  const [restaurants, placeCount, lostPetCount] = await Promise.all([
    prisma.restaurant.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        businessType: true,
        sido: true,
        sigungu: true,
        eupmyeondong: true,
        address: true,
        lat: true,
        lng: true,
        officialRegistered: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    }),
    prisma.place.count({ where: { isActive: true } }),
    prisma.lostPet.count({ where: { status: { in: ["APPROVED", "FOUND"] } } }),
  ]);

  const restaurantsLight = restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    businessType: r.businessType,
    sido: r.sido,
    sigungu: r.sigungu,
    eupmyeondong: r.eupmyeondong,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    officialRegistered: r.officialRegistered,
    updatedAt: r.updatedAt.toISOString(),
  }));

  const mapPoints = restaurantsLight
    .filter((r) => r.lat !== null && r.lng !== null)
    .map((r) => ({ id: r.id, name: r.name, businessType: r.businessType, lat: r.lat as number, lng: r.lng as number }));

  const bySidoMap = new Map<string, number>();
  const bySigunguMap = new Map<string, { sido: string; sigungu: string; count: number }>();
  for (const r of restaurantsLight) {
    bySidoMap.set(r.sido, (bySidoMap.get(r.sido) ?? 0) + 1);
    if (r.sigungu) {
      const key = `${r.sido}::${r.sigungu}`;
      const cur = bySigunguMap.get(key);
      if (cur) cur.count += 1;
      else bySigunguMap.set(key, { sido: r.sido, sigungu: r.sigungu, count: 1 });
    }
  }

  const categoryCounts = {
    restaurantCount: restaurantsLight.length,
    restaurantCoordinateReadyCount: mapPoints.length,
    restaurantCoordinatePendingCount: Math.max(restaurantsLight.length - mapPoints.length, 0),
    placeCount,
    lostPetCount,
    lastUpdatedAt: restaurantsLight[0]?.updatedAt ?? null,
  };

  const regions = {
    bySido: Array.from(bySidoMap.entries())
      .map(([sido, count]) => ({ sido, count }))
      .sort((a, b) => b.count - a.count || a.sido.localeCompare(b.sido, "ko-KR")),
    bySigungu: Array.from(bySigunguMap.values())
      .sort((a, b) => b.count - a.count || a.sido.localeCompare(b.sido, "ko-KR") || a.sigungu.localeCompare(b.sigungu, "ko-KR")),
  };

  return { restaurantsLight, mapPoints, categoryCounts, regions };
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const access = await getAdminAccess(secret);

  if (!access || !hasRequiredAdminRole(access.roles, ["SUPER_ADMIN", "OPERATIONS_ADMIN"])) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await generateSnapshotData();

    // Vercel 환경: 파일 쓰기가 불가능하므로 deploy hook으로 재빌드 트리거
    const deployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL?.trim();
    if (deployHookUrl) {
      const hookResponse = await fetch(deployHookUrl, { method: "POST" });
      return NextResponse.json({
        ok: true,
        mode: "deploy-hook",
        deployHookTriggered: hookResponse.ok,
        deployHookStatus: hookResponse.status,
        restaurantCount: data.restaurantsLight.length,
        mapPointCount: data.mapPoints.length,
        regionsBySido: data.regions.bySido.length,
        message: hookResponse.ok
          ? "Vercel 재빌드가 트리거되었습니다. 1~2분 후 반영됩니다."
          : `Deploy hook 호출 실패 (${hookResponse.status})`,
      });
    }

    // 로컬 개발 환경: public/data/ 직접 쓰기
    const outputDir = path.join(process.cwd(), "public", "data");
    await fs.mkdir(outputDir, { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(outputDir, "restaurants-light.json"), JSON.stringify(data.restaurantsLight, null, 2), "utf8"),
      fs.writeFile(path.join(outputDir, "map-points.json"), JSON.stringify(data.mapPoints, null, 2), "utf8"),
      fs.writeFile(path.join(outputDir, "category-counts.json"), JSON.stringify(data.categoryCounts, null, 2), "utf8"),
      fs.writeFile(path.join(outputDir, "regions.json"), JSON.stringify(data.regions, null, 2), "utf8"),
    ]);

    return NextResponse.json({
      ok: true,
      mode: "direct-write",
      restaurantCount: data.restaurantsLight.length,
      mapPointCount: data.mapPoints.length,
      regionsBySido: data.regions.bySido.length,
      message: "public/data 스냅샷이 갱신되었습니다.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
