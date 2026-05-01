import type { SyncSource } from "@prisma/client";
import { getExternalSyncDisabledReason, isExternalSyncDisabled } from "@/lib/external-sync";
import { prisma } from "@/lib/prisma";
import { parseSyncMinHours, shouldSkipSync } from "@/lib/foodsafety/policy";
import { acquireSyncLock, releaseSyncLock } from "@/lib/sources/sync-lock";

type RunManagedSyncOptions = {
  source: SyncSource;
  sourceUrl?: string;
  force?: boolean;
  mode?: string;
  skipWhenExternalSyncDisabled?: boolean;
  runner: () => Promise<{ totalCount?: number; addedCount?: number; updatedCount?: number; removedCount?: number; message?: string; sourceUrl?: string }>;
};

function minHoursBetweenSyncs() {
  return parseSyncMinHours(process.env.SYNC_MIN_HOURS);
}

async function createSkippedSyncLog(options: RunManagedSyncOptions, skippedReason: string) {
  const skipped = await prisma.syncLog.create({
    data: {
      source: options.source,
      mode: options.mode ?? "scheduled",
      status: "SKIPPED",
      finishedAt: new Date(),
      skippedReason,
      message: skippedReason,
      sourceUrl: options.sourceUrl,
    },
  });

  return { skipped: true as const, log: skipped };
}

export async function runManagedSync(options: RunManagedSyncOptions) {
  if (options.skipWhenExternalSyncDisabled && isExternalSyncDisabled()) {
    return createSkippedSyncLog(options, getExternalSyncDisabledReason());
  }

  const minHours = minHoursBetweenSyncs();
  const lastSuccess = await prisma.syncLog.findFirst({
    where: { source: options.source, status: "SUCCESS" },
    orderBy: { finishedAt: "desc" },
  });

  if (!options.force && lastSuccess?.finishedAt && shouldSkipSync(lastSuccess.finishedAt, minHours)) {
    return createSkippedSyncLog(options, `Skipped: last successful sync was within ${minHours} hours.`);
  }

  const lock = await acquireSyncLock(options.source);
  if (!lock.ok) {
    return createSkippedSyncLog(options, "Skipped: sync lock already active.");
  }

  const log = await prisma.syncLog.create({
    data: {
      source: options.source,
      mode: options.mode ?? "scheduled",
      status: "FAILED",
      sourceUrl: options.sourceUrl,
    },
  });

  try {
    const result = await options.runner();
    const updated = await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
        totalCount: result.totalCount ?? 0,
        addedCount: result.addedCount ?? 0,
        updatedCount: result.updatedCount ?? 0,
        removedCount: result.removedCount ?? 0,
        message: result.message,
        sourceUrl: result.sourceUrl ?? options.sourceUrl,
      },
    });
    return { skipped: false, log: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failed = await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorMessage: message,
      },
    });
    throw Object.assign(new Error(message), { log: failed });
  } finally {
    await releaseSyncLock(options.source);
  }
}