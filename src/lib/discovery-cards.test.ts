import test from "node:test";
import assert from "node:assert/strict";
import { getDiscoveryQualityScore, getPlaceIdentity, getPublicReviewSummary, getRestaurantIdentity, getReviewSummaryLabel } from "./discovery-cards";

test("getReviewSummaryLabel includes count and average when reviews exist", () => {
  assert.equal(getReviewSummaryLabel(3, 4.666), "리뷰 3건 · 평점 4.7");
  assert.equal(getReviewSummaryLabel(1, null), "리뷰 1건");
  assert.equal(getReviewSummaryLabel(0, 5), "아직 후기가 없어요");
});

test("getPublicReviewSummary reads target keyed summaries", () => {
  const summary = {
    "PLACE:abc": {
      targetType: "PLACE" as const,
      targetId: "abc",
      count: 2,
      averageOverall: 4.5,
      averagePetFriendly: 4,
      latestReviewAt: "2026-05-06T00:00:00.000Z",
    },
  };

  assert.equal(getPublicReviewSummary(summary, "PLACE", "abc")?.count, 2);
  assert.equal(getPublicReviewSummary(summary, "RESTAURANT", "abc"), null);
});

test("getDiscoveryQualityScore favors review, phone, external info, and coordinates", () => {
  const emptyScore = getDiscoveryQualityScore({});
  const richScore = getDiscoveryQualityScore({
    phone: "02-000-0000",
    externalHref: "https://example.com/place",
    reviewCount: 2,
    hasCoordinates: true,
  });

  assert.equal(emptyScore, 0);
  assert.ok(richScore > emptyScore);
});

test("getRestaurantIdentity prioritizes external place category over generic business type", () => {
  const identity = getRestaurantIdentity({ businessType: "일반음식점", externalCategory: "음식점 > 한식" });

  assert.equal(identity.identityLabel, "한식");
  assert.match(identity.description, /한식 성격의 음식점/);
  assert.equal(identity.infoCtaLabel, "메뉴·동반 정보 알려주기");
});

test("getPlaceIdentity derives category-specific service gaps", () => {
  const hospital = getPlaceIdentity({ category: "ANIMAL_HOSPITAL", name: "24시 튼튼 동물의료센터" });
  const pharmacy = getPlaceIdentity({ category: "PHARMACY", name: "1004 약국" });
  const daycare = getPlaceIdentity({ category: "DAYCARE", name: "멍멍 호텔" });

  assert.equal(hospital.identityLabel, "24시 후보 병원");
  assert.equal(pharmacy.infoCtaLabel, "약품 정보 알려주기");
  assert.equal(daycare.identityLabel, "호텔·위탁");
});