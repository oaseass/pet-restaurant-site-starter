import { runManagedSync } from "@/lib/sources/sync-runner";

export async function syncAnimalDaycare(options: { force?: boolean } = {}) {
  return runManagedSync({
    source: "LOCALDATA_DAYCARE",
    sourceUrl: "https://www.localdata.go.kr",
    force: options.force,
    runner: async () => ({
      totalCount: 0,
      message: "LocalData daycare connector placeholder. Service details remain separated from official source sync.",
    }),
  });
}