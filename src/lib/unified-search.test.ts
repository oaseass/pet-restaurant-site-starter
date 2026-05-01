import test from "node:test";
import assert from "node:assert/strict";
import { createUnifiedSearchService } from "./unified-search";

test("createUnifiedSearchService queries only internal deps and merges static guides", async () => {
  const calls: Array<{ target: string; where?: unknown }> = [];

  const service = createUnifiedSearchService({
    restaurant: {
      findMany: async (args) => {
        calls.push({ target: "restaurant", where: args.where });
        return [{ id: "r1", name: "서울 카페", address: "서울 강남구", sido: "서울", sigungu: "강남구", eupmyeondong: null, businessType: "카페", sourceKey: "r1", normalizedAddress: "서울 강남구", officialRegistered: true, status: "ACTIVE", sourceUrl: "https://example.com", dataUpdatedAt: new Date(), firstSeenAt: new Date(), lastSeenAt: new Date(), createdAt: new Date(), updatedAt: new Date(), lat: null, lng: null }];
      },
    },
    place: {
      findMany: async (args) => {
        calls.push({ target: "place", where: args.where });
        return [{ id: "p1", category: "ANIMAL_HOSPITAL", name: "튼튼동물병원", normalizedName: "튼튼동물병원", sido: "서울", sigungu: "강남구", eupmyeondong: null, address: "서울 강남구", roadAddress: null, lat: null, lng: null, phone: null, businessStatus: null, sourceType: "OFFICIAL_DATA", sourceName: null, sourceUrl: null, sourceId: null, sourceUpdatedAt: null, firstSeenAt: new Date(), lastSeenAt: new Date(), ownerVerified: false, isActive: true, createdAt: new Date(), updatedAt: new Date() }];
      },
    },
    guide: {
      findMany: async (args) => {
        calls.push({ target: "guide", where: args.where });
        return [];
      },
    },
    lostPet: {
      findMany: async (args) => {
        calls.push({ target: "lostPet", where: args.where });
        return [];
      },
    },
  });

  const result = await service({ keyword: "비행기", sido: "서울" });

  assert.equal(result.restaurants.length, 1);
  assert.equal(result.places.length, 1);
  assert.equal(result.guides.some((guide) => guide.slug === "flight"), true);
  assert.deepEqual(calls.map((call) => call.target), ["restaurant", "place", "guide", "lostPet"]);
});