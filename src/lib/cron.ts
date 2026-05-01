import { NextRequest, NextResponse } from "next/server";

export function isCronAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export function isForceSyncEnabled() {
  return process.env.ENABLE_FORCE_SYNC === "true";
}

export async function handleCronRequest(
  request: NextRequest,
  runner: (options: { force?: boolean }) => Promise<Record<string, unknown>>
) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get("force") === "1";
  if (force && !isForceSyncEnabled()) {
    return NextResponse.json({ ok: false, message: "Force sync disabled" }, { status: 403 });
  }

  try {
    const result = await runner({ force });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}