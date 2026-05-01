import test from "node:test";
import assert from "node:assert/strict";
import { parseSyncMinHours, shouldSkipSync } from "./policy";

test("parseSyncMinHours returns 23 for invalid values", () => {
  assert.equal(parseSyncMinHours(undefined), 23);
  assert.equal(parseSyncMinHours("0"), 23);
  assert.equal(parseSyncMinHours("-4"), 23);
  assert.equal(parseSyncMinHours("abc"), 23);
});

test("parseSyncMinHours keeps explicit positive hour values", () => {
  assert.equal(parseSyncMinHours("12"), 12);
});

test("shouldSkipSync blocks requests within the 23 hour window", () => {
  const lastSuccess = new Date("2026-05-01T00:00:00.000Z");
  const now = new Date("2026-05-01T22:59:59.000Z");

  assert.equal(shouldSkipSync(lastSuccess, 23, now), true);
});

test("shouldSkipSync allows syncs once the full window has passed", () => {
  const lastSuccess = new Date("2026-05-01T00:00:00.000Z");
  const now = new Date("2026-05-01T23:00:00.000Z");

  assert.equal(shouldSkipSync(lastSuccess, 23, now), false);
});
