import { NextRequest, NextResponse } from "next/server";
import { syncPetRestaurants } from "@/lib/foodsafety/sync";
import { handleCronRequest } from "@/lib/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleCronRequest(request, ({ force }) => syncPetRestaurants({ force }));
}
