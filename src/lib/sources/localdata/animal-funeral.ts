import { runManagedSync } from "@/lib/sources/sync-runner";

export async function syncAnimalFuneral(options: { force?: boolean } = {}) {
  return runManagedSync({
    source: "LOCALDATA_FUNERAL",
    sourceUrl: "https://www.localdata.go.kr",
    force: options.force,
    runner: async () => ({
      totalCount: 0,
      message: "LocalData funeral connector placeholder. Last known official data should remain served until import is enabled.",
    }),
  });
}