import test from "node:test";
import assert from "node:assert/strict";
import { buildListFilterHref, filterByListLocation, getSidoFullName, getSidoLabel, parseListSearchParams } from "./list-location-filters";

test("getSidoLabel matches short and full region names", () => {
  assert.equal(getSidoLabel("경기도"), "경기");
  assert.equal(getSidoLabel("강원특별자치도"), "강원");
  assert.equal(getSidoLabel("전북특별자치도"), "전북");
  assert.equal(getSidoFullName("경기"), "경기도");
});

test("filterByListLocation accepts mixed sido naming", () => {
  const items = [
    { id: "a", sido: "경기도", lat: 37.5, lng: 127.0 },
    { id: "b", sido: "서울", lat: 37.55, lng: 126.98 },
  ];

  const state = parseListSearchParams({ sido: "경기" });

  assert.deepEqual(filterByListLocation(items, state).map((item) => item.id), ["a"]);
});

test("filterByListLocation applies valid Korean coordinates and radius", () => {
  const items = [
    { id: "near", sido: "경기", lat: 37.5005, lng: 127.0005 },
    { id: "far", sido: "경기", lat: 35.1, lng: 129.0 },
  ];

  const state = parseListSearchParams({ lat: "37.500000", lng: "127.000000", radiusKm: "3" });

  assert.deepEqual(filterByListLocation(items, state).map((item) => item.id), ["near"]);
});

test("buildListFilterHref replaces list filters but keeps other query params", () => {
  assert.equal(buildListFilterHref("/restaurants?type=카페&sido=서울", { sido: "경기" }), "/restaurants?type=%EC%B9%B4%ED%8E%98&sido=%EA%B2%BD%EA%B8%B0");
});

test("parseListSearchParams and buildListFilterHref support recent check filter", () => {
  assert.equal(parseListSearchParams({ checked: "recent" }).checked, "recent");
  assert.equal(buildListFilterHref("/hospitals?sido=서울", { checked: "recent" }), "/hospitals?checked=recent");
});

test("parseListSearchParams and buildListFilterHref support information needs filter", () => {
  const state = parseListSearchParams({ info: "needs", checked: "recent" });

  assert.equal(state.info, "needs");
  assert.equal(buildListFilterHref("/hospitals?sido=서울&info=needs", { sido: "경기", info: "needs" }), "/hospitals?sido=%EA%B2%BD%EA%B8%B0&info=needs");
  assert.equal(buildListFilterHref("/hospitals?sido=서울&info=needs", { sido: "경기" }), "/hospitals?sido=%EA%B2%BD%EA%B8%B0");
});