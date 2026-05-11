import test from "node:test";
import assert from "node:assert/strict";
import { buildPlaceExperienceQueries, getPlaceExperienceChecklist, inferPlaceExperienceCategory } from "./place-experience";

test("inferPlaceExperienceCategory detects pension-like daycare places", () => {
  assert.equal(inferPlaceExperienceCategory({ baseCategory: "DAYCARE", name: "태화산 애견펜션" }), "ACCOMMODATION_PENSION");
  assert.equal(inferPlaceExperienceCategory({ baseCategory: "DAYCARE", name: "멍멍 글램핑 캠프" }), "ACCOMMODATION_CAMPING");
  assert.equal(inferPlaceExperienceCategory({ baseCategory: "DAYCARE", name: "댕댕 행동교정 스쿨" }), "TRAINING");
  assert.equal(inferPlaceExperienceCategory({ baseCategory: "DAYCARE", name: "개민박" }), "DAYCARE");
  assert.equal(inferPlaceExperienceCategory({ baseCategory: "DAYCARE", name: "고양이민박" }), "DAYCARE");
});

test("buildPlaceExperienceQueries expands pension search phrases", () => {
  const queries = buildPlaceExperienceQueries({
    category: "ACCOMMODATION_PENSION",
    placeName: "멍스테이",
    regionLabel: "가평군",
    address: "경기도 가평군 상면",
  });

  assert.ok(queries.includes("멍스테이 애견동반 펜션"));
  assert.ok(queries.includes("멍스테이 반려동물 동반 숙소"));
  assert.ok(queries.includes("가평군 강아지 동반 숙소"));
});

test("getPlaceExperienceChecklist returns pension confirmation items", () => {
  const checklist = getPlaceExperienceChecklist("ACCOMMODATION_PENSION");
  assert.ok(checklist.includes("반려견 동반 객실 여부"));
  assert.equal(getPlaceExperienceChecklist("FOOD_RESTAURANT").length, 0);
});