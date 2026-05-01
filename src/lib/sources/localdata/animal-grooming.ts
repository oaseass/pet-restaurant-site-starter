import { syncLocalDataCategory } from "@/lib/sources/localdata/common";

export async function syncAnimalGrooming(options: { force?: boolean } = {}) {
  return syncLocalDataCategory({
    source: "LOCALDATA_GROOMING",
    category: "GROOMING",
    urlEnvName: "LOCALDATA_GROOMING_URL",
    sourceLabel: "반려동물 미용",
    activeStatusKeywords: ["정상", "영업", "운영", "개설"],
  }, options);
}