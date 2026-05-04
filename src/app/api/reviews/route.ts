import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const targetTypeSchema = z.enum(["RESTAURANT", "PLACE"]);
const ratingSchema = z.coerce.number().int().min(1).max(5);
const optionalRatingSchema = z.preprocess((value) => value === "" || value === null ? undefined : value, ratingSchema.optional());

const reviewSchema = z.object({
  targetType: targetTypeSchema,
  targetId: z.string().min(5).max(80),
  ratingOverall: ratingSchema,
  ratingPetFriendly: ratingSchema,
  ratingCleanliness: optionalRatingSchema,
  ratingStaff: optionalRatingSchema,
  ratingParking: optionalRatingSchema,
  petType: z.enum(["DOG", "CAT", "BOTH", "OTHER"]),
  petSize: z.enum(["SMALL", "MEDIUM", "LARGE", "UNKNOWN"]),
  visitDate: z.coerce.date(),
  title: z.string().trim().min(3).max(80),
  body: z.string().trim().min(20).max(1200),
  indoorAllowed: z.enum(["YES", "NO", "UNKNOWN"]),
  outdoorAllowed: z.enum(["YES", "NO", "UNKNOWN"]),
  largeDogAllowed: z.enum(["YES", "NO", "UNKNOWN"]),
  carrierRequired: z.enum(["YES", "NO", "UNKNOWN"]),
  leashRequired: z.enum(["YES", "NO", "UNKNOWN"]),
});

const BLOCKED_TERMS = ["씨발", "시발", "개새끼", "병신", "좆", "fuck"];
const PHONE_PATTERN = /(?:\d{2,3}[-.\s]?\d{3,4}[-.\s]?\d{4})/;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

function getRedirectUrl(request: NextRequest, targetType: string, targetId: string, params: Record<string, string>) {
  const url = new URL("/reviews/new", request.url);
  url.searchParams.set("targetType", targetType);
  url.searchParams.set("targetId", targetId);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

function wantsJson(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  const accept = request.headers.get("accept") ?? "";
  return contentType.includes("application/json") || accept.includes("application/json");
}

function failureResponse(request: NextRequest, jsonMode: boolean, targetType: string, targetId: string, message: string, status = 400) {
  if (jsonMode) {
    return NextResponse.json({ ok: false, message }, { status });
  }

  return NextResponse.redirect(getRedirectUrl(request, targetType, targetId, { error: message }), { status: 303 });
}

function hasUnsafeText(value: string) {
  const normalized = value.toLowerCase();
  return BLOCKED_TERMS.some((term) => normalized.includes(term));
}

function validateReviewText(title: string, body: string) {
  const combined = `${title}\n${body}`;
  if (hasUnsafeText(combined)) return "부적절한 표현이 포함되어 있습니다.";
  if (PHONE_PATTERN.test(combined) || EMAIL_PATTERN.test(combined)) return "전화번호나 이메일 같은 개인정보는 리뷰에 적을 수 없습니다.";
  return null;
}

async function targetExists(targetType: "RESTAURANT" | "PLACE", targetId: string) {
  if (targetType === "RESTAURANT") {
    return Boolean(await prisma.restaurant.findFirst({ where: { id: targetId, status: "ACTIVE" }, select: { id: true } }));
  }

  return Boolean(await prisma.place.findFirst({ where: { id: targetId, isActive: true }, select: { id: true } }));
}

export async function POST(request: NextRequest) {
  const jsonMode = wantsJson(request);
  const raw = jsonMode ? await request.json() as Record<string, unknown> : Object.fromEntries((await request.formData()).entries());
  const parsed = reviewSchema.safeParse(raw);

  const rawTargetType = String(raw.targetType ?? "");
  const rawTargetId = String(raw.targetId ?? "");

  if (!parsed.success) {
    return failureResponse(request, jsonMode, rawTargetType, rawTargetId, "입력값을 확인해 주세요.");
  }

  const textError = validateReviewText(parsed.data.title, parsed.data.body);
  if (textError) {
    return failureResponse(request, jsonMode, parsed.data.targetType, parsed.data.targetId, textError);
  }

  if (!(await targetExists(parsed.data.targetType, parsed.data.targetId))) {
    return failureResponse(request, jsonMode, parsed.data.targetType, parsed.data.targetId, "리뷰 대상을 찾을 수 없습니다.", 404);
  }

  await prisma.review.create({
    data: {
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      ratingOverall: parsed.data.ratingOverall,
      ratingPetFriendly: parsed.data.ratingPetFriendly,
      ratingCleanliness: parsed.data.ratingCleanliness ?? null,
      ratingStaff: parsed.data.ratingStaff ?? null,
      ratingParking: parsed.data.ratingParking ?? null,
      petType: parsed.data.petType,
      petSize: parsed.data.petSize,
      visitDate: parsed.data.visitDate,
      title: parsed.data.title,
      body: parsed.data.body,
      indoorAllowed: parsed.data.indoorAllowed,
      outdoorAllowed: parsed.data.outdoorAllowed,
      largeDogAllowed: parsed.data.largeDogAllowed,
      carrierRequired: parsed.data.carrierRequired,
      leashRequired: parsed.data.leashRequired,
      images: [],
      status: "PENDING",
    },
  });

  revalidatePath("/admin/reviews");

  if (jsonMode) {
    return NextResponse.json({ ok: true, message: "검수 후 반영됩니다." }, { status: 201 });
  }

  return NextResponse.redirect(getRedirectUrl(request, parsed.data.targetType, parsed.data.targetId, { submitted: "1" }), { status: 303 });
}