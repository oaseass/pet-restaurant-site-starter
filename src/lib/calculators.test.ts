import test from "node:test";
import assert from "node:assert/strict";
import { calculateFeedingAmount, calculateMonthlyCost, calculateVaccinationSchedule } from "./calculators";

test("calculateVaccinationSchedule returns age stage and next action", () => {
  const result = calculateVaccinationSchedule({ animalType: "dog", birthDate: "2026-01-01", adoptionDate: undefined, lastVaccinationDate: "2026-03-01" });

  assert.equal(typeof result.currentStage, "string");
  assert.equal(result.nextVaccination.length > 0, true);
});

test("calculateMonthlyCost sums monthly and yearly totals", () => {
  const result = calculateMonthlyCost({ animalType: "cat", weightKg: 4, ageYears: 3, foodCost: 50000, snackCost: 10000, groomingCost: 0, hospitalCost: 30000, daycareCost: 0, insuranceCost: 20000, otherCost: 5000 });

  assert.equal(result.monthlyTotal, 115000);
  assert.equal(result.yearlyTotal, 1380000);
});

test("calculateFeedingAmount returns grams per meal", () => {
  const result = calculateFeedingAmount({ animalType: "dog", weightKg: 5, ageYears: 2, neutered: "yes", activityLevel: "normal", foodKcalPer100g: 350 });

  assert.equal(result.dailyKcal > 0, true);
  assert.equal(result.dailyGrams > 0, true);
  assert.equal(result.perMealGrams > 0, true);
});