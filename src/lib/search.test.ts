import test from "node:test";
import assert from "node:assert/strict";
import { buildRestaurantSearchWhere, normalizeRestaurantSearchParams } from "./search";

test("normalizeRestaurantSearchParams trims each incoming value", () => {
  assert.deepEqual(
    normalizeRestaurantSearchParams({ q: "  전주  ", sido: "  전북 ", type: " 일반음식점  " }),
    { q: "전주", sido: "전북", type: "일반음식점" }
  );
});

test("buildRestaurantSearchWhere includes DB-only search fields", () => {
  assert.deepEqual(buildRestaurantSearchWhere({ q: "전주" }), {
    status: "ACTIVE",
    OR: [
      { name: { contains: "전주", mode: "insensitive" } },
      { address: { contains: "전주", mode: "insensitive" } },
      { sido: { contains: "전주", mode: "insensitive" } },
      { sigungu: { contains: "전주", mode: "insensitive" } },
      { eupmyeondong: { contains: "전주", mode: "insensitive" } },
    ],
  });
});

test("buildRestaurantSearchWhere merges exact filters with free-text search", () => {
  assert.deepEqual(buildRestaurantSearchWhere({ q: "남원", sido: "전북", type: "휴게음식점" }), {
    status: "ACTIVE",
    sido: "전북",
    businessType: "휴게음식점",
    OR: [
      { name: { contains: "남원", mode: "insensitive" } },
      { address: { contains: "남원", mode: "insensitive" } },
      { sido: { contains: "남원", mode: "insensitive" } },
      { sigungu: { contains: "남원", mode: "insensitive" } },
      { eupmyeondong: { contains: "남원", mode: "insensitive" } },
    ],
  });
});
