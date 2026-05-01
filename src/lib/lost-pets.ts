import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const lostPetFormSchema = z.object({
  petName: z.string().min(1, "이름을 입력하세요."),
  animalType: z.enum(["강아지", "고양이"]),
  breed: z.string().optional(),
  sex: z.string().optional(),
  age: z.string().optional(),
  photoUrlsText: z.string().optional(),
  lostSido: z.string().min(1, "시도를 입력하세요."),
  lostSigungu: z.string().optional(),
  lostAddress: z.string().min(2, "실종 위치를 입력하세요."),
  lostAt: z.string().min(1, "실종 날짜를 입력하세요."),
  description: z.string().min(10, "특징을 조금 더 자세히 적어주세요."),
  rewardAmount: z.string().optional(),
  contactValue: z.string().min(6, "연락 수단을 입력하세요."),
});

export function maskContact(value: string) {
  const trimmed = value.trim();
  if (trimmed.includes("@")) {
    const [local, domain] = trimmed.split("@");
    const visible = local.slice(0, 2);
    return `${visible}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 8) {
    return `${digits.slice(0, 3)}-${"*".repeat(Math.max(3, digits.length - 7))}-${digits.slice(-4)}`;
  }

  return `${trimmed.slice(0, 2)}${"*".repeat(Math.max(2, trimmed.length - 2))}`;
}

export function normalizePhotoUrls(photoUrlsText?: string) {
  if (!photoUrlsText) return [];
  return photoUrlsText
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function createLostPetSubmission(input: z.infer<typeof lostPetFormSchema>) {
  const parsed = lostPetFormSchema.parse(input);
  const rewardAmount = parsed.rewardAmount ? Number(parsed.rewardAmount.replace(/[^0-9]/g, "")) : null;
  const photoUrls = normalizePhotoUrls(parsed.photoUrlsText);

  return prisma.lostPet.create({
    data: {
      petName: parsed.petName,
      animalType: parsed.animalType,
      breed: parsed.breed || null,
      sex: parsed.sex || null,
      age: parsed.age || null,
      photoUrls,
      lostSido: parsed.lostSido,
      lostSigungu: parsed.lostSigungu || null,
      lostAddress: parsed.lostAddress,
      lostAt: new Date(parsed.lostAt),
      description: parsed.description,
      rewardAmount: Number.isFinite(rewardAmount) ? rewardAmount : null,
      contactToken: crypto.randomBytes(16).toString("hex"),
      contactMasked: maskContact(parsed.contactValue),
    },
  });
}