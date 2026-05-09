import test from "node:test";
import assert from "node:assert/strict";
import { buildNavigationLinks } from "./navigation-links";

test("buildNavigationLinks includes Google Maps directions when coordinates exist", () => {
  const links = buildNavigationLinks({
    name: "시장뒷고기",
    address: "경상남도 김해시 경원로 9",
    lat: 35.2390824,
    lng: 128.8620105,
  });

  assert.equal(
    links.googleMapsUrl,
    "https://www.google.com/maps/dir/?api=1&destination=%EC%8B%9C%EC%9E%A5%EB%92%B7%EA%B3%A0%EA%B8%B0%20%EA%B2%BD%EC%83%81%EB%82%A8%EB%8F%84%20%EA%B9%80%ED%95%B4%EC%8B%9C%20%EA%B2%BD%EC%9B%90%EB%A1%9C%209&travelmode=driving",
  );
});

test("buildNavigationLinks keeps coordinate Google Maps directions when address is missing", () => {
  const links = buildNavigationLinks({
    name: "시장뒷고기",
    lat: 35.2390824,
    lng: 128.8620105,
  });

  assert.equal(links.googleMapsUrl, "https://www.google.com/maps/dir/?api=1&destination=35.239082,128.862010&travelmode=driving");
});

test("buildNavigationLinks falls back to Google Maps search without coordinates", () => {
  const links = buildNavigationLinks({
    name: "1004 약국",
    address: "경기도 고양시 덕양구 동세로 19",
  });

  assert.match(links.googleMapsUrl ?? "", /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/);
  assert.match(decodeURIComponent(links.googleMapsUrl ?? ""), /1004 약국 경기도 고양시 덕양구 동세로 19/);
});