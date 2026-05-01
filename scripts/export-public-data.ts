import { loadEnvConfig } from "@next/env";
import { promises as fs } from "node:fs";
import path from "node:path";

loadEnvConfig(process.cwd());

async function main() {
  const { prisma } = await import("../src/lib/prisma");

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

  const restaurantsLight = restaurants.map((restaurant) => ({
    id: restaurant.id,
    name: restaurant.name,
    businessType: restaurant.businessType,
    sido: restaurant.sido,
    sigungu: restaurant.sigungu,
    eupmyeondong: restaurant.eupmyeondong,
    address: restaurant.address,
    lat: restaurant.lat,
    lng: restaurant.lng,
    officialRegistered: restaurant.officialRegistered,
    updatedAt: restaurant.updatedAt.toISOString(),
  }));

  const mapPoints = restaurantsLight
    .filter((restaurant) => restaurant.lat !== null && restaurant.lng !== null)
    .map((restaurant) => ({
      id: restaurant.id,
      name: restaurant.name,
      businessType: restaurant.businessType,
      lat: restaurant.lat as number,
      lng: restaurant.lng as number,
    }));

  const bySidoMap = new Map<string, number>();
  const bySigunguMap = new Map<string, { sido: string; sigungu: string; count: number }>();

  for (const restaurant of restaurantsLight) {
    bySidoMap.set(restaurant.sido, (bySidoMap.get(restaurant.sido) ?? 0) + 1);

    if (restaurant.sigungu) {
      const sigunguKey = `${restaurant.sido}::${restaurant.sigungu}`;
      const current = bySigunguMap.get(sigunguKey);
      if (current) {
        current.count += 1;
      } else {
        bySigunguMap.set(sigunguKey, { sido: restaurant.sido, sigungu: restaurant.sigungu, count: 1 });
      }
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
      .sort((left, right) => right.count - left.count || left.sido.localeCompare(right.sido, "ko-KR")),
    bySigungu: Array.from(bySigunguMap.values())
      .sort((left, right) => right.count - left.count || left.sido.localeCompare(right.sido, "ko-KR") || left.sigungu.localeCompare(right.sigungu, "ko-KR")),
  };

  const outputDirectory = path.join(process.cwd(), "public", "data");
  await fs.mkdir(outputDirectory, { recursive: true });

  await Promise.all([
    fs.writeFile(path.join(outputDirectory, "restaurants-light.json"), JSON.stringify(restaurantsLight, null, 2)),
    fs.writeFile(path.join(outputDirectory, "map-points.json"), JSON.stringify(mapPoints, null, 2)),
    fs.writeFile(path.join(outputDirectory, "category-counts.json"), JSON.stringify(categoryCounts, null, 2)),
    fs.writeFile(path.join(outputDirectory, "regions.json"), JSON.stringify(regions, null, 2)),
  ]);

  console.log(JSON.stringify({
    restaurantsLight: restaurantsLight.length,
    mapPoints: mapPoints.length,
    regionsBySido: regions.bySido.length,
    regionsBySigungu: regions.bySigungu.length,
    lastUpdatedAt: categoryCounts.lastUpdatedAt,
  }, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });