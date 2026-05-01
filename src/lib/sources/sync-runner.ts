import type { SyncSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseSyncMinHours, shouldSkipSync } from "@/lib/foodsafety/policy";
import { acquireSyncLock, releaseSyncLock } from "@/lib/sources/sync-lock";

type RunManagedSyncOptions = {
  source: SyncSource;
  sourceUrl?: string;
  force?: boolean;
  mode?: string;
  runner: () => Promise<{ totalCount?: number; addedCount?: number; updatedCount?: number; removedCount?: number; message?: string; sourceUrl?: string }>;
};

function minHoursBetweenSyncs() {
  return parseSyncMinHours(process.env.SYNC_MIN_HOURS);
}

export async function runManagedSync(options: RunManagedSyncOptions) {
  const minHours = minHoursBetweenSyncs();
  const lastSuccess = await prisma.syncLog.findFirst({
    where: { source: options.source, status: "SUCCESS" },
    orderBy: { finishedAt: "desc" },
  });

  if (!options.force && lastSuccess?.finishedAt && shouldSkipSync(lastSuccess.finishedAt, minHours)) {
    const skipped = await prisma.syncLog.create({
      data: {
        source: options.source,
        mode: options.mode ?? "scheduled",
        status: "SKIPPED",
        finishedAt: new Date(),
        skippedReason: `Skipped: last successful sync was within ${minHours} hours.`,
        sourceUrl: options.sourceUrl,
      },
    });
    return { skipped: true, log: skipped };
  }

  const lock = await acquireSyncLock(options.source);
  if (!lock.ok) {
    const skipped = await prisma.syncLog.create({
      data: {
        source: options.source,
        mode: options.mode ?? "scheduled",
        status: "SKIPPED",
        finishedAt: new Date(),
        skippedReason: "Skipped: sync lock already active.",
        sourceUrl: options.sourceUrl,
      },
    });
    return { skipped: true, log: skipped };
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