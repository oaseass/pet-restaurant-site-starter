import { z } from "zod";

export const vaccinationInputSchema = z.object({
  animalType: z.enum(["dog", "cat"]),
  birthDate: z.string().optional(),
  adoptionDate: z.string().optional(),
  lastVaccinationDate: z.string().optional(),
});

export function calculateAgeInMonths(dateText?: string) {
  if (!dateText) return null;
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  return Math.floor(days / 30.4);
}

export function calculateVaccinationSchedule(input: z.infer<typeof vaccinationInputSchema>) {
  const ageMonths = calculateAgeInMonths(input.birthDate ?? input.adoptionDate);
  const lastVaccinationDate = input.lastVaccinationDate ? new Date(input.lastVaccinationDate) : null;
  const lastVaccinationLabel = lastVaccinationDate && !Number.isNaN(lastVaccinationDate.getTime())
    ? lastVaccinationDate.toLocaleDateString("ko-KR")
    : "이력 없음";

  const isYoung = ageMonths !== null && ageMonths < 6;
  const nextVaccination = input.animalType === "dog"
    ? isYoung
      ? "종합백신 추가 접종 여부 확인"
      : "연 1회 종합백신·광견병 재확인"
    : isYoung
      ? "종합백신과 고양이 백혈병 접종 여부 확인"
      : "연 1회 핵심백신·광견병 여부 재확인";

  return {
    ageMonths,
    currentStage: ageMonths === null ? "월령 정보 없음" : `${ageMonths}개월`,
    lastVaccinationLabel,
    nextVaccination,
    precautionsBefore: ["접종 전 컨디션이 좋지 않으면 병원에 먼저 상담하세요.", "기저질환이나 알러지 병력이 있으면 접종 계획이 달라질 수 있습니다."],
    precautionsAfter: ["접종 후 무기력, 열, 심한 구토가 지속되면 즉시 병원에 문의하세요.", "개별 접종 계획은 수의사 상담이 우선입니다."],
  };
}

export const monthlyCostInputSchema = z.object({
  animalType: z.enum(["dog", "cat"]),
  weightKg: z.coerce.number().min(0).default(0),
  ageYears: z.coerce.number().min(0).default(0),
  foodCost: z.coerce.number().min(0).default(0),
  snackCost: z.coerce.number().min(0).default(0),
  groomingCost: z.coerce.number().min(0).default(0),
  hospitalCost: z.coerce.number().min(0).default(0),
  daycareCost: z.coerce.number().min(0).default(0),
  insuranceCost: z.coerce.number().min(0).default(0),
  otherCost: z.coerce.number().min(0).default(0),
});

export function calculateMonthlyCost(input: z.infer<typeof monthlyCostInputSchema>) {
  const entries = [
    { label: "사료비", value: input.foodCost },
    { label: "간식비", value: input.snackCost },
    { label: "미용비", value: input.groomingCost },
    { label: "병원비", value: input.hospitalCost },
    { label: "유치원/호텔비", value: input.daycareCost },
    { label: "보험료", value: input.insuranceCost },
    { label: "기타", value: input.otherCost },
  ];

  const monthlyTotal = entries.reduce((sum, entry) => sum + entry.value, 0);
  const yearlyTotal = monthlyTotal * 12;

  return {
    monthlyTotal,
    yearlyTotal,
    breakdown: entries.map((entry) => ({
      ...entry,
      percent: monthlyTotal > 0 ? Math.round((entry.value / monthlyTotal) * 100) : 0,
    })),
    tip: input.animalType === "dog"
      ? "정기 예방접종, 미용 주기를 미리 예산에 포함하면 급격한 지출을 줄이기 쉽습니다."
      : "모래, 습식 캔, 정기 검진 비용을 분리해 보면 더 현실적인 예산을 잡을 수 있습니다.",
  };
}

export const feedingInputSchema = z.object({
  animalType: z.enum(["dog", "cat"]),
  weightKg: z.coerce.number().positive(),
  ageYears: z.coerce.number().min(0),
  neutered: z.enum(["yes", "no"]),
  activityLevel: z.enum(["low", "normal", "high"]),
  foodKcalPer100g: z.coerce.number().positive(),
});

export function calculateFeedingAmount(input: z.infer<typeof feedingInputSchema>) {
  const restEnergy = 70 * Math.pow(input.weightKg, 0.75);
  const activityFactor = input.animalType === "cat"
    ? input.neutered === "yes" ? 1.1 : 1.2
    : input.activityLevel === "high" ? 1.8 : input.activityLevel === "low" ? 1.2 : 1.5;
  const maintenanceEnergy = Math.round(restEnergy * activityFactor);
  const dailyGrams = Math.round((maintenanceEnergy / input.foodKcalPer100g) * 100);

  return {
    dailyKcal: maintenanceEnergy,
    dailyGrams,
    perMealGrams: Math.round(dailyGrams / 2),
    notes: [
      "몸무게 변화와 컨디션에 따라 급여량은 조절이 필요합니다.",
      "질환, 처방식, 체중 감량 계획은 반드시 수의사 상담이 필요합니다.",
    ],
  };
}