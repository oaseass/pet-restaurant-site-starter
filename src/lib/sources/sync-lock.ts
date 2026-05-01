import type { SyncSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function acquireSyncLock(source: SyncSource, ttlMinutes = 30) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
  const existing = await prisma.syncLock.findUnique({ where: { source } });

  if (existing && existing.expiresAt > now && existing.status === "LOCKED") {
    return { ok: false as const, lock: existing };
  }

  const lock = await prisma.syncLock.upsert({
    where: { source },
    update: { lockedAt: now, expiresAt, status: "LOCKED" },
    create: { source, lockedAt: now, expiresAt, status: "LOCKED" },
  });

  return { ok: true as const, lock };
}

export async function releaseSyncLock(source: SyncSource) {
  await prisma.syncLock.update({
    where: { source },
    data: { status: "RELEASED", expiresAt: new Date() },
  }).catch(() => undefined);
}