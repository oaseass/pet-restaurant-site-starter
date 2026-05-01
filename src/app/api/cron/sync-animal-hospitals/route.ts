import { NextRequest } from "next/server";
import { handleCronRequest } from "@/lib/cron";
import { syncAnimalHospitals } from "@/lib/sources/localdata/animal-hospitals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleCronRequest(request, ({ force }) => syncAnimalHospitals({ force }));
}