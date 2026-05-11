import "@/lib/auth-env";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  ALL_ADMIN_ROLES,
  formatAdminRoleLabels,
  hasRequiredAdminRole,
  isAdminConfigured,
  isAdminRole,
  isAdminSecretAuthorized,
  type AdminRole,
} from "@/lib/admin-access-config";

export type AdminAccess = {
  email: string;
  name: string;
  roles: AdminRole[];
  method: "session" | "secret";
};

type AdminAccessOptions = {
  secret?: string | null;
  requiredRoles?: AdminRole[];
  returnTo?: string;
};

export function isAdminAuthorized(secret?: string | null) {
  return isAdminSecretAuthorized(secret);
}

export async function getAdminAccess(secret?: string | null): Promise<AdminAccess | null> {
  if (!isAdminConfigured()) {
    return null;
  }

  if (isAdminSecretAuthorized(secret)) {
    return {
      email: "emergency-secret@daengnyang.local",
      name: "Emergency Secret Access",
      roles: ALL_ADMIN_ROLES,
      method: "secret",
    };
  }

  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.trim().toLowerCase();
  const roles = Array.isArray(session?.user?.roles)
    ? session.user.roles.filter((role): role is AdminRole => isAdminRole(role))
    : [];

  if (!email || roles.length === 0) {
    return null;
  }

  return {
    email,
    name: session?.user?.name?.trim() || email,
    roles,
    method: "session",
  };
}

export async function canPerformAdminAction(options: AdminAccessOptions = {}) {
  const access = await getAdminAccess(options.secret);
  if (!access) return false;
  return hasRequiredAdminRole(access.roles, options.requiredRoles);
}

export async function requireAdminPageAccess(options: AdminAccessOptions = {}) {
  const access = await getAdminAccess(options.secret);
  if (access && hasRequiredAdminRole(access.roles, options.requiredRoles)) {
    return access;
  }

  redirect(buildAdminLoginPath(options.returnTo));
}

export function buildAdminLoginPath(returnTo?: string) {
  if (!returnTo || !returnTo.startsWith("/")) {
    return "/admin/login";
  }

  return `/admin/login?next=${encodeURIComponent(returnTo)}`;
}

export function formatAdminRoles(roles: AdminRole[]) {
  return formatAdminRoleLabels(roles).join(" · ");
}