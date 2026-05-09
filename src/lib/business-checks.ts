import {
  createEmptyBusinessCheckSummary,
  RECENT_BUSINESS_CHECK_DAYS,
  type BusinessCheckResultValue,
  type BusinessCheckSummary,
  type BusinessCheckTargetType,
} from "@/lib/business-checks-shared";

function toPublicBusinessCheck(item: {
  id: string;
  checkType: string;
  result: string;
  checkedAt: Date;
  createdAt: Date;
}) {
  return {
    id: item.id,
    checkType: item.checkType as BusinessCheckSummary["recentChecks"][number]["checkType"],
    result: item.result as BusinessCheckResultValue,
    checkedAt: item.checkedAt.toISOString(),
    createdAt: item.createdAt.toISOString(),
  };
}

function summarizeApprovedBusinessChecks(targetType: BusinessCheckTargetType, targetId: string, checks: Array<{
  id: string;
  checkType: string;
  result: string;
  checkedAt: Date;
  createdAt: Date;
}>): BusinessCheckSummary {
  const resultCounts: Partial<Record<BusinessCheckResultValue, number>> = {};
  for (const check of checks) {
    const result = check.result as BusinessCheckResultValue;
    resultCounts[result] = (resultCounts[result] ?? 0) + 1;
  }

  return {
    targetType,
    targetId,
    count: checks.length,
    latestCheckedAt: checks[0]?.checkedAt.toISOString() ?? null,
    latestResult: checks[0]?.result as BusinessCheckResultValue | undefined ?? null,
    resultCounts,
    recentChecks: checks.slice(0, 3).map(toPublicBusinessCheck),
  };
}

export async function getApprovedBusinessCheckSummary(targetType: BusinessCheckTargetType, targetId: string): Promise<BusinessCheckSummary> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const checks = await prisma.businessCheck.findMany({
      where: { targetType, targetId, status: "APPROVED" },
      orderBy: [{ checkedAt: "desc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        checkType: true,
        result: true,
        checkedAt: true,
        createdAt: true,
      },
    });

    return summarizeApprovedBusinessChecks(targetType, targetId, checks);
  } catch {
    return createEmptyBusinessCheckSummary(targetType, targetId);
  }
}

export async function getApprovedBusinessCheckSummaries(targetType: BusinessCheckTargetType, targetIds: string[]) {
  const uniqueTargetIds = [...new Set(targetIds.filter(Boolean))];
  const summaries = new Map<string, BusinessCheckSummary>();
  if (uniqueTargetIds.length === 0) return summaries;

  try {
    const { prisma } = await import("@/lib/prisma");
    const checks = await prisma.businessCheck.findMany({
      where: { targetType, targetId: { in: uniqueTargetIds }, status: "APPROVED" },
      orderBy: [{ targetId: "asc" }, { checkedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        targetId: true,
        checkType: true,
        result: true,
        checkedAt: true,
        createdAt: true,
      },
    });

    const grouped = new Map<string, typeof checks>();
    for (const check of checks) {
      const group = grouped.get(check.targetId) ?? [];
      group.push(check);
      grouped.set(check.targetId, group);
    }

    for (const targetId of uniqueTargetIds) {
      const group = grouped.get(targetId);
      if (group?.length) summaries.set(targetId, summarizeApprovedBusinessChecks(targetType, targetId, group));
    }
  } catch {
    return summaries;
  }

  return summaries;
}

export async function getRecentApprovedBusinessCheckTargetIds(targetType: BusinessCheckTargetType, days = RECENT_BUSINESS_CHECK_DAYS) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const checkedAfter = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await prisma.businessCheck.findMany({
      where: { targetType, status: "APPROVED", checkedAt: { gte: checkedAfter } },
      distinct: ["targetId"],
      select: { targetId: true },
    });
    return new Set(rows.map((row) => row.targetId));
  } catch {
    return new Set<string>();
  }
}
