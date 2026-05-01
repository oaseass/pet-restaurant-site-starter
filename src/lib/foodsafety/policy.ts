export function parseSyncMinHours(rawValue: string | undefined) {
  const parsed = Number(rawValue ?? "23");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 23;
}

export function shouldSkipSync(lastSuccessfulSyncAt: Date, minHours: number, now = new Date()) {
  const elapsedMs = now.getTime() - lastSuccessfulSyncAt.getTime();
  return elapsedMs < minHours * 60 * 60 * 1000;
}
