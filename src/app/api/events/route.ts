import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const eventSchema = z.object({
  targetType: z.enum(["RESTAURANT", "PLACE"]),
  targetId: z.string().min(5).max(100),
  action: z.enum(["phone", "phone_report", "internal_map", "kakao_map", "google_maps", "naver_map", "tmap", "copy_address", "review", "report"]),
  label: z.string().max(120).optional(),
  href: z.string().max(2000).nullable().optional(),
  path: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  console.info("detail_action", {
    ...parsed.data,
    at: new Date().toISOString(),
  });

  return new Response(null, { status: 204 });
}