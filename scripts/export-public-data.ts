import { loadEnvConfig } from "@next/env";
import { promises as fs } from "node:fs";
import path from "node:path";

loadEnvConfig(process.cwd());

async function main() {
  const { prisma } = await import("../src/lib/prisma");

  const [restaurants, placeCount, lostPetCount, nonRestaurantPlaces] = await Promise.all([
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
    prisma.place.findMany({
      where: {
        isActive: true,
        category: { in: ["ANIMAL_HOSPITAL", "PHARMACY", "GROOMING", "DAYCARE", "FUNERAL"] },
      },
      select: {
        id: true,
        category: true,
        name: true,
        address: true,
        roadAddress: true,
        sido: true,
        sigungu: true,
        phone: true,
        lat: true,
        lng: true,
        sourceName: true,
        businessStatus: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    }),
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

  const TRAINING_KEYWORDS = ["훈련", "트레이닝", "교육", "스쿨", "아카데미", "행동교정", "반려견학교", "애견훈련"];
  const HOTEL_KEYWORDS = ["호텔", "유치원", "데이케어", "놀이방", "위탁", "돌봄", "보호"];

  function getDaycareTags(name: string): string[] {
    const lower = name.toLowerCase();
    const tags: string[] = [];
    if (TRAINING_KEYWORDS.some((kw) => lower.includes(kw))) tags.push("training");
    if (HOTEL_KEYWORDS.some((kw) => lower.includes(kw))) tags.push("hotel");
    return tags;
  }

  const placesLight = nonRestaurantPlaces.map((place) => ({
    id: place.id,
    category: place.category,
    name: place.name,
    address: place.address,
    roadAddress: place.roadAddress,
    sido: place.sido,
    sigungu: place.sigungu,
    phone: place.phone,
    lat: place.lat,
    lng: place.lng,
    sourceName: place.sourceName,
    businessStatus: place.businessStatus,
    tags: place.category === "DAYCARE" ? getDaycareTags(place.name) : undefined,
    updatedAt: place.updatedAt.toISOString(),
  }));

  const placeMapPoints = placesLight
    .filter((place) => place.lat !== null && place.lng !== null)
    .map((place) => ({
      id: place.id,
      category: place.category,
      name: place.name,
      lat: place.lat as number,
      lng: place.lng as number,
      phone: place.phone,
    }));

  await Promise.all([
    fs.writeFile(path.join(outputDirectory, "restaurants-light.json"), JSON.stringify(restaurantsLight, null, 2)),
    fs.writeFile(path.join(outputDirectory, "map-points.json"), JSON.stringify(mapPoints, null, 2)),
    fs.writeFile(path.join(outputDirectory, "category-counts.json"), JSON.stringify(categoryCounts, null, 2)),
    fs.writeFile(path.join(outputDirectory, "regions.json"), JSON.stringify(regions, null, 2)),
    fs.writeFile(path.join(outputDirectory, "places-light.json"), JSON.stringify(placesLight, null, 2)),
    fs.writeFile(path.join(outputDirectory, "place-map-points.json"), JSON.stringify(placeMapPoints, null, 2)),
  ]);

  console.log(JSON.stringify({
    restaurantsLight: restaurantsLight.length,
    mapPoints: mapPoints.length,
    placesLight: placesLight.length,
    placeMapPoints: placeMapPoints.length,
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