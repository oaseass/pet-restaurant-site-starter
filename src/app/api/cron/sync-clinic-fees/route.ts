import { NextRequest } from "next/server";
import { handleCronRequest } from "@/lib/cron";
import { syncClinicFeeReference } from "@/lib/sources/clinic-fee/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleCronRequest(request, ({ force }) => syncClinicFeeReference({ force }));
}