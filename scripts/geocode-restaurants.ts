import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { parseGeocodeRestaurantsArgs, geocodeRestaurantsBatch } = await import("../src/lib/restaurant-geocode");
  const args = parseGeocodeRestaurantsArgs(process.argv.slice(2));
  const result = await geocodeRestaurantsBatch(args);

  console.log(JSON.stringify(result, null, 2));
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });