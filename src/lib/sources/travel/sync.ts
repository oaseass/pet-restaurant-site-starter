import { runManagedSync } from "@/lib/sources/sync-runner";

export async function syncTravelReferences(options: { force?: boolean } = {}) {
  const airline = await runManagedSync({
    source: "AIRLINE_OFFICIAL",
    sourceUrl: "https://www.koreanair.com",
    force: options.force,
    runner: async () => ({ totalCount: 3, message: "Airline rules remain admin-reviewed and are not fetched on user requests." }),
  });

  const ship = await runManagedSync({
    source: "SHIP_MANUAL",
    sourceUrl: "https://www.seaferry.co.kr",
    force: options.force,
    runner: async () => ({ totalCount: 1, message: "Ship rules remain manual-review data due to provider-specific variance." }),
  });

  return { skipped: airline.skipped && ship.skipped, results: { airline, ship } };
}