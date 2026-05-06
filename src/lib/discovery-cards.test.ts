import test from "node:test";
import assert from "node:assert/strict";
import { getDiscoveryQualityScore, getPublicReviewSummary, getReviewSummaryLabel } from "./discovery-cards";

test("getReviewSummaryLabel includes count and average when reviews exist", () => {
  assert.equal(getReviewSummaryLabel(3, 4.666), "리뷰 3건 · 평점 4.7");
  assert.equal(getReviewSummaryLabel(1, null), "리뷰 1건");
  assert.equal(getReviewSummaryLabel(0, 5), "첫 리뷰 대기");
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