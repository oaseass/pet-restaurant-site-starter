import { NextRequest } from "next/server";
import { handleCronRequest } from "@/lib/cron";
import { syncPetRestaurants } from "@/lib/foodsafety/sync";
import { syncAnimalHospitals } from "@/lib/sources/localdata/animal-hospitals";
import { syncAnimalBusinesses } from "@/lib/sources/localdata/animal-businesses";
import { syncClinicFeeReference } from "@/lib/sources/clinic-fee/sync";
import { syncTravelReferences } from "@/lib/sources/travel/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleCronRequest(request, async ({ force }) => {
    const restaurant = await syncPetRestaurants({ force });
    const hospitals = await syncAnimalHospitals({ force });
    const businesses = await syncAnimalBusinesses({ force });
    const clinicFees = await syncClinicFeeReference({ force });
    const travel = await syncTravelReferences({ force });

    return {
      skipped: false,
      results: { restaurant, hospitals, businesses, clinicFees, travel },
    };
  });
}