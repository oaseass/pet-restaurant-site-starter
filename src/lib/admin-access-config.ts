import crypto from "crypto";

export const ADMIN_ROLES = ["SUPER_ADMIN", "OPERATIONS_ADMIN", "CONTENT_ADMIN", "REVIEWER", "ANALYST"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ALL_ADMIN_ROLES = [...ADMIN_ROLES];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "최고 관리자",
  OPERATIONS_ADMIN: "운영 관리자",
  CONTENT_ADMIN: "콘텐츠 관리자",
  REVIEWER: "검수 담당",
  ANALYST: "분석 담당",
};

type ConfiguredAdminUser = {
  email: string;
  password: string;
  name: string;
  roles: AdminRole[];
};

function normalizeText(value: string | undefined | null) {
  return String(value ?? "").trim();
}

function normalizeEmail(value: string | undefined | null) {
  return normalizeText(value).toLowerCase();
}

export function isAdminConfigured() {
  return normalizeText(process.env.ADMIN_SECRET).length > 0;
}

function digest(value: string) {
  return crypto.createHash("sha256").update(value).digest();
}

export function safeCompare(left: string, right: string) {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);
  if (!normalizedLeft || !normalizedRight) return false;
  return crypto.timingSafeEqual(digest(normalizedLeft), digest(normalizedRight));
}

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && ADMIN_ROLES.includes(value as AdminRole);
}

export function normalizeAdminRoles(value: unknown): AdminRole[] {
  if (!Array.isArray(value)) return ["SUPER_ADMIN"];
  const roles = value.filter(isAdminRole);
  return roles.length > 0 ? roles : ["SUPER_ADMIN"];
}

function parseAdminUsersFromEnv() {
  const raw = normalizeText(process.env.ADMIN_USERS_JSON);
  if (!raw) return [] as ConfiguredAdminUser[];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [] as ConfiguredAdminUser[];

    return parsed
      .map((item) => {
        const email = normalizeEmail((item as { email?: string }).email);
        const password = normalizeText((item as { password?: string }).password);
        if (!email || !password) return null;

        return {
          email,
          password,
          name: normalizeText((item as { name?: string }).name) || email,
          roles: normalizeAdminRoles((item as { roles?: unknown }).roles),
        } satisfies ConfiguredAdminUser;
      })
      .filter((item): item is ConfiguredAdminUser => Boolean(item));
  } catch {
    return [] as ConfiguredAdminUser[];
  }
}

function getBootstrapAdminUser() {
  const adminSecret = normalizeText(process.env.ADMIN_SECRET);
  const password = normalizeText(process.env.ADMIN_BOOTSTRAP_PASSWORD)
    || adminSecret;

  if (!adminSecret || !password) return null;

  return {
    email: normalizeEmail(process.env.ADMIN_LOGIN_EMAIL) || "admin@daengnyang.local",
    password,
    name: normalizeText(process.env.ADMIN_LOGIN_NAME) || "댕냥지도 운영 관리자",
    roles: ALL_ADMIN_ROLES,
  } satisfies ConfiguredAdminUser;
}

export function getConfiguredAdminUsers() {
  if (!isAdminConfigured()) return [];

  const configuredUsers = parseAdminUsersFromEnv();
  if (configuredUsers.length > 0) return configuredUsers;

  const bootstrap = getBootstrapAdminUser();
  return bootstrap ? [bootstrap] : [];
}

export function findConfiguredAdminUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  return getConfiguredAdminUsers().find((user) => user.email === normalizedEmail && safeCompare(user.password, password)) ?? null;
}

export function isAdminSecretAuthorized(secret?: string | null) {
  const expected = normalizeText(process.env.ADMIN_SECRET);
  if (!expected) return false;
  return safeCompare(expected, normalizeText(secret));
}

export function hasRequiredAdminRole(userRoles: AdminRole[], requiredRoles: AdminRole[] = []) {
  if (requiredRoles.length === 0) return userRoles.length > 0;
  if (userRoles.includes("SUPER_ADMIN")) return true;
  return requiredRoles.some((role) => userRoles.includes(role));
}

export function formatAdminRoleLabels(roles: AdminRole[]) {
  return roles.map((role) => ADMIN_ROLE_LABELS[role]);
}

export function getNextAuthSecret() {
  return normalizeText(process.env.NEXTAUTH_SECRET)
    || normalizeText(process.env.AUTH_SECRET)
    || normalizeText(process.env.ADMIN_SECRET)
    || "daengnyang-admin-dev-secret";
}