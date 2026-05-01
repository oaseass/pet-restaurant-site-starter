export function isAdminAuthorized(secret?: string | null) {
  const expected = (process.env.ADMIN_SECRET ?? process.env.CRON_SECRET ?? "").trim();
  if (!expected) return false;
  return (secret ?? "").trim() === expected;
}