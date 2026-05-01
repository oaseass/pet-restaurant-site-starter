import test from "node:test";
import assert from "node:assert/strict";
import { lostPetFormSchema, maskContact, normalizePhotoUrls } from "./lost-pets";

test("maskContact masks phone numbers and email addresses", () => {
  assert.equal(maskContact("010-1234-5678"), "010-****-5678");
  assert.equal(maskContact("petlover@example.com"), "pe******@example.com");
});

test("normalizePhotoUrls splits comma and newline separated input", () => {
  assert.deepEqual(normalizePhotoUrls("https://a.com/1.png, https://a.com/2.png\nhttps://a.com/3.png"), [
    "https://a.com/1.png",
    "https://a.com/2.png",
    "https://a.com/3.png",
  ]);
});

test("lostPetFormSchema requires essential fields", () => {
  const parsed = lostPetFormSchema.safeParse({
    petName: "초코",
    animalType: "강아지",
    lostSido: "서울",
    lostAddress: "서울 강남구",
    lostAt: "2026-05-01",
    description: "갈색 목줄을 하고 있고 사람을 잘 따릅니다.",
    contactValue: "01012345678",
  });

  assert.equal(parsed.success, true);
});