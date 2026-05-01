import { syncLocalDataCategory } from "@/lib/sources/localdata/common";

export async function syncAnimalFuneral(options: { force?: boolean } = {}) {
  return syncLocalDataCategory({
    source: "LOCALDATA_FUNERAL",
    category: "FUNERAL",
    urlEnvName: "LOCALDATA_FUNERAL_URL",
    sourceLabel: "동물장묘업",
    activeStatusKeywords: ["정상", "영업", "운영", "개설"],
  }, options);
}