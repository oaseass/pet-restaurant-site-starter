import test from "node:test";
import assert from "node:assert/strict";
import { MAX_RESTAURANT_GEOCODE_LIMIT, createRestaurantGeocodeCacheKey, parseGeocodeRestaurantsArgs } from "./restaurant-geocode";

test("parseGeocodeRestaurantsArgs uses safe defaults", () => {
  assert.deepEqual(parseGeocodeRestaurantsArgs([]), {
    limit: MAX_RESTAURANT_GEOCODE_LIMIT,
    dryRun: false,
  });
});

test("parseGeocodeRestaurantsArgs reads limit and dry-run flags", () => {
  assert.deepEqual(parseGeocodeRestaurantsArgs(["--limit=5", "--dry-run"]), {
    limit: 5,
    dryRun: true,
  });

  assert.deepEqual(parseGeocodeRestaurantsArgs(["--limit", "10"]), {
    limit: 10,
    dryRun: false,
  });
});

test("parseGeocodeRestaurantsArgs rejects oversized limits", () => {
  assert.throws(
    () => parseGeocodeRestaurantsArgs([`--limit=${MAX_RESTAURANT_GEOCODE_LIMIT + 1}`]),
    /최대 100건까지만 처리할 수 있습니다/,
  );
});

test("createRestaurantGeocodeCacheKey normalizes spacing and parentheses", () => {
  assert.equal(
    createRestaurantGeocodeCacheKey("서울특별시  강남구 (테스트)  1층"),
    "서울특별시 강남구 테스트 1층",
  );

  assert.equal(
    createRestaurantGeocodeCacheKey("ignored", "서울특별시 강남구 테스트 1층"),
    "서울특별시 강남구 테스트 1층",
  );
});