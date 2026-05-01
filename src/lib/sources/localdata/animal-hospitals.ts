import { runManagedSync } from "@/lib/sources/sync-runner";

export async function syncAnimalHospitals(options: { force?: boolean } = {}) {
  return runManagedSync({
    source: "LOCALDATA_ANIMAL_HOSPITAL",
    sourceUrl: "https://www.localdata.go.kr",
    force: options.force,
    runner: async () => ({
      totalCount: 0,
      addedCount: 0,
      updatedCount: 0,
      removedCount: 0,
      message: "LocalData animal hospital connector is prepared for daily batch execution. Last successful data remains served until official import is enabled.",
    }),
  });
}