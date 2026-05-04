export type ReviewTargetTypeValue = "RESTAURANT" | "PLACE";
export type ReviewPolicyAnswerValue = "YES" | "NO" | "UNKNOWN";

export type PublicReviewItem = {
  id: string;
  ratingOverall: number;
  ratingPetFriendly: number;
  ratingCleanliness: number | null;
  ratingStaff: number | null;
  ratingParking: number | null;
  petType: string;
  petSize: string;
  visitDate: string;
  title: string;
  body: string;
  indoorAllowed: ReviewPolicyAnswerValue;
  outdoorAllowed: ReviewPolicyAnswerValue;
  largeDogAllowed: ReviewPolicyAnswerValue;
  carrierRequired: ReviewPolicyAnswerValue;
  leashRequired: ReviewPolicyAnswerValue;
  createdAt: string;
};

export type ReviewSummary = {
  targetType: ReviewTargetTypeValue;
  targetId: string;
  count: number;
  averageOverall: number | null;
  averagePetFriendly: number | null;
  indoorAllowedRate: number | null;
  largeDogAllowedRate: number | null;
  recentReviews: PublicReviewItem[];
};

export function createEmptyReviewSummary(targetType: ReviewTargetTypeValue, targetId: string): ReviewSummary {
  return {
    targetType,
    targetId,
    count: 0,
    averageOverall: null,
    averagePetFriendly: null,
    indoorAllowedRate: null,
    largeDogAllowedRate: null,
    recentReviews: [],
  };
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function yesRate(values: ReviewPolicyAnswerValue[]) {
  const known = values.filter((value) => value === "YES" || value === "NO");
  if (known.length === 0) return null;
  const yes = known.filter((value) => value === "YES").length;
  return yes / known.length;
}

function toPublicReview(item: {
  id: string;
  ratingOverall: number;
  ratingPetFriendly: number;
  ratingCleanliness: number | null;
  ratingStaff: number | null;
  ratingParking: number | null;
  petType: string;
  petSize: string;
  visitDate: Date;
  title: string;
  body: string;
  indoorAllowed: ReviewPolicyAnswerValue;
  outdoorAllowed: ReviewPolicyAnswerValue;
  largeDogAllowed: ReviewPolicyAnswerValue;
  carrierRequired: ReviewPolicyAnswerValue;
  leashRequired: ReviewPolicyAnswerValue;
  createdAt: Date;
}): PublicReviewItem {
  return {
    id: item.id,
    ratingOverall: item.ratingOverall,
    ratingPetFriendly: item.ratingPetFriendly,
    ratingCleanliness: item.ratingCleanliness,
    ratingStaff: item.ratingStaff,
    ratingParking: item.ratingParking,
    petType: item.petType,
    petSize: item.petSize,
    visitDate: item.visitDate.toISOString(),
    title: item.title,
    body: item.body,
    indoorAllowed: item.indoorAllowed,
    outdoorAllowed: item.outdoorAllowed,
    largeDogAllowed: item.largeDogAllowed,
    carrierRequired: item.carrierRequired,
    leashRequired: item.leashRequired,
    createdAt: item.createdAt.toISOString(),
  };
}

export async function getApprovedReviewSummary(targetType: ReviewTargetTypeValue, targetId: string): Promise<ReviewSummary> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const reviews = await prisma.review.findMany({
      where: { targetType, targetId, status: "APPROVED" },
      orderBy: [{ visitDate: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        ratingOverall: true,
        ratingPetFriendly: true,
        ratingCleanliness: true,
        ratingStaff: true,
        ratingParking: true,
        petType: true,
        petSize: true,
        visitDate: true,
        title: true,
        body: true,
        indoorAllowed: true,
        outdoorAllowed: true,
        largeDogAllowed: true,
        carrierRequired: true,
        leashRequired: true,
        createdAt: true,
      },
    });

    return {
      targetType,
      targetId,
      count: reviews.length,
      averageOverall: average(reviews.map((item) => item.ratingOverall)),
      averagePetFriendly: average(reviews.map((item) => item.ratingPetFriendly)),
      indoorAllowedRate: yesRate(reviews.map((item) => item.indoorAllowed)),
      largeDogAllowedRate: yesRate(reviews.map((item) => item.largeDogAllowed)),
      recentReviews: reviews.slice(0, 3).map(toPublicReview),
    };
  } catch {
    return createEmptyReviewSummary(targetType, targetId);
  }
}