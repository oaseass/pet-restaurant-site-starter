import test from "node:test";
import assert from "node:assert/strict";
import { buildExternalReviewSearchShortcuts } from "./ExternalReviewLinksPanel";

test("buildExternalReviewSearchShortcuts creates category-aware blog and web searches", () => {
  const shortcuts = buildExternalReviewSearchShortcuts({
    name: "멍카페",
    category: "RESTAURANT",
    categoryLabel: "반려동물 동반 식당",
    regionLabel: "서울 강남구",
    address: "서울특별시 강남구 테헤란로 1",
  });

  assert.equal(shortcuts.length, 3);
  assert.equal(shortcuts[0]?.sourceLabel, "네이버 블로그 검색");
  assert.match(shortcuts[0]?.href ?? "", /where=blog/);
  assert.match(decodeURIComponent(shortcuts[0]?.href ?? ""), /멍카페 애견동반 카페/);
  assert.equal(shortcuts[1]?.sourceLabel, "다음 블로그 검색");
  assert.equal(shortcuts[2]?.sourceLabel, "구글 검색");
});

test("buildExternalReviewSearchShortcuts still returns shortcuts without explicit category", () => {
  const shortcuts = buildExternalReviewSearchShortcuts({
    name: "튼튼동물병원",
    categoryLabel: "동물병원",
    regionLabel: "성남 분당구",
    address: "경기도 성남시 분당구 판교역로 1",
  });

  assert.equal(shortcuts.length, 3);
  assert.match(decodeURIComponent(shortcuts[0]?.href ?? ""), /튼튼동물병원/);
});