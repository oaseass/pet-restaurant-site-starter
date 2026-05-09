import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BUSINESS_CHECK_RESULTS, BUSINESS_CHECK_TYPES } from "@/lib/business-checks-shared";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const businessCheckSchema = z.object({
  targetType: z.enum(["RESTAURANT", "PLACE"]),
  targetId: z.string().min(5).max(100),
  checkType: z.enum(BUSINESS_CHECK_TYPES),
  result: z.enum(BUSINESS_CHECK_RESULTS),
  checkedAt: z.coerce.date(),
  note: z.string().trim().max(300).optional(),
});

const BLOCKED_TERMS = ["씨발", "시발", "개새끼", "병신", "좆", "fuck"];
const PHONE_PATTERN = /(?:\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{4})/;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function hasUnsafeText(value: string) {
  const normalized = value.toLowerCase();
  return BLOCKED_TERMS.some((term) => normalized.includes(term));
}

function validateNote(value?: string) {
  if (!value) return null;
  if (hasUnsafeText(value)) return "부적절한 표현이 포함되어 있습니다.";
  if (PHONE_PATTERN.test(value) || EMAIL_PATTERN.test(value)) return "전화번호나 이메일 같은 개인정보는 적을 수 없습니다.";
  return null;
}

async function targetExists(targetType: "RESTAURANT" | "PLACE", targetId: string) {
  if (targetType === "RESTAURANT") {
    return Boolean(await prisma.restaurant.findFirst({ where: { id: targetId, status: "ACTIVE" }, select: { id: true } }));
  }

  return Boolean(await prisma.place.findFirst({ where: { id: targetId, isActive: true }, select: { id: true } }));
}

export async function POST(request: NextRequest) {
  const parsed = businessCheckSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "입력값을 확인해 주세요." }, { status: 400 });
  }

  const noteError = validateNote(parsed.data.note);
  if (noteError) {
    return NextResponse.json({ ok: false, message: noteError }, { status: 400 });
  }

  if (!(await targetExists(parsed.data.targetType, parsed.data.targetId))) {
    return NextResponse.json({ ok: false, message: "확인 대상을 찾을 수 없습니다." }, { status: 404 });
  }

  const now = new Date();
  const checkedAt = parsed.data.checkedAt > now ? now : parsed.data.checkedAt;
  await prisma.businessCheck.create({
    data: {
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      checkType: parsed.data.checkType,
      result: parsed.data.result,
      checkedAt,
      note: parsed.data.note || null,
      status: "PENDING",
    },
  });

  revalidatePath("/admin/business-checks");
  return NextResponse.json({ ok: true, message: "확인 제보가 접수되었습니다." }, { status: 201 });
}
