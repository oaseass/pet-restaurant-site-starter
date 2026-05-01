import { runManagedSync } from "@/lib/sources/sync-runner";

export async function syncAnimalGrooming(options: { force?: boolean } = {}) {
  return runManagedSync({
    source: "LOCALDATA_GROOMING",
    sourceUrl: "https://www.localdata.go.kr",
    force: options.force,
    runner: async () => ({
      totalCount: 0,
      message: "LocalData grooming connector placeholder. Official daily batch hook is reserved for server-only execution.",
    }),
  });
}