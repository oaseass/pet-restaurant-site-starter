import { syncPetRestaurants } from "../src/lib/foodsafety/sync";

const force = process.argv.includes("--force");

syncPetRestaurants({ force })
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
