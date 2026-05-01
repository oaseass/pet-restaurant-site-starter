import { syncLocalDataCategory } from "@/lib/sources/localdata/common";

export async function syncAnimalHospitals(options: { force?: boolean } = {}) {
  return syncLocalDataCategory({
    source: "LOCALDATA_ANIMAL_HOSPITAL",
    category: "ANIMAL_HOSPITAL",
    urlEnvName: "LOCALDATA_ANIMAL_HOSPITAL_URL",
    sourceLabel: "동물병원",
    activeStatusKeywords: ["정상", "영업", "운영", "개설"],
  }, options);
}