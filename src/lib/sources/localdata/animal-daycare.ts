import { syncLocalDataCategory } from "@/lib/sources/localdata/common";

export async function syncAnimalDaycare(options: { force?: boolean } = {}) {
  return syncLocalDataCategory({
    source: "LOCALDATA_DAYCARE",
    category: "DAYCARE",
    urlEnvName: "LOCALDATA_DAYCARE_URL",
    sourceLabel: "유치원·위탁관리",
    activeStatusKeywords: ["정상", "영업", "운영", "개설"],
  }, options);
}