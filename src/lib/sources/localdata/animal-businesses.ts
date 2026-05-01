import { syncAnimalGrooming } from "@/lib/sources/localdata/animal-grooming";
import { syncAnimalDaycare } from "@/lib/sources/localdata/animal-daycare";
import { syncAnimalFuneral } from "@/lib/sources/localdata/animal-funeral";

export async function syncAnimalBusinesses(options: { force?: boolean } = {}) {
  const [grooming, daycare, funeral] = await Promise.all([
    syncAnimalGrooming(options),
    syncAnimalDaycare(options),
    syncAnimalFuneral(options),
  ]);

  return {
    skipped: grooming.skipped && daycare.skipped && funeral.skipped,
    results: { grooming, daycare, funeral },
  };
}