import { NextRequest } from "next/server";
import { handleCronRequest } from "@/lib/cron";
import { syncAnimalBusinesses } from "@/lib/sources/localdata/animal-businesses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleCronRequest(request, ({ force }) => syncAnimalBusinesses({ force }));
}