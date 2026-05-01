import { runManagedSync } from "@/lib/sources/sync-runner";

export async function syncClinicFeeReference(options: { force?: boolean } = {}) {
  return runManagedSync({
    source: "ANIMAL_CLINIC_FEE",
    sourceUrl: "https://www.animal.go.kr",
    force: options.force,
    runner: async () => ({
      totalCount: 0,
      message: "Clinic fee reference is prepared as a daily admin-reviewed dataset. Final prices must never be shown as fixed prices.",
    }),
  });
}