import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { handleCronRequest, isCronAuthorized } from "./cron";

test("isCronAuthorized returns false without matching bearer token", () => {
  process.env.CRON_SECRET = "secret-token";
  const request = new NextRequest("https://example.com/api/cron/test");

  assert.equal(isCronAuthorized(request), false);
});

test("handleCronRequest allows authorized requests", async () => {
  process.env.CRON_SECRET = "secret-token";
  process.env.ENABLE_FORCE_SYNC = "true";
  const request = new NextRequest("https://example.com/api/cron/test?force=1", {
    headers: { authorization: "Bearer secret-token" },
  });

  const response = await handleCronRequest(request, async ({ force }) => ({ skipped: false, force }));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.force, true);
});

test("handleCronRequest blocks unauthorized requests", async () => {
  process.env.CRON_SECRET = "secret-token";
  const request = new NextRequest("https://example.com/api/cron/test");

  const response = await handleCronRequest(request, async () => ({ skipped: false }));
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.ok, false);
});