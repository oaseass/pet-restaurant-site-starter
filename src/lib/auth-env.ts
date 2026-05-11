import { getSiteUrl } from "@/lib/brand";

const AUTH_URL_KEYS = ["NEXTAUTH_URL", "NEXTAUTH_URL_INTERNAL", "AUTH_URL"] as const;
const OPTIONAL_URL_KEYS = ["VERCEL_URL"] as const;

function normalizeEnvValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function setAuthUrl(key: (typeof AUTH_URL_KEYS)[number]) {
  const value = normalizeEnvValue(process.env[key]);
  process.env[key] = value ?? getSiteUrl();
}

function clearBlankUrl(key: (typeof OPTIONAL_URL_KEYS)[number]) {
  const value = normalizeEnvValue(process.env[key]);
  if (value) {
    process.env[key] = value;
    return;
  }

  delete process.env[key];
}

for (const key of AUTH_URL_KEYS) {
  setAuthUrl(key);
}

for (const key of OPTIONAL_URL_KEYS) {
  clearBlankUrl(key);
}