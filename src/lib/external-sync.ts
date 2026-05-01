const EXTERNAL_SYNC_DISABLED_REASON = "External source sync disabled after 403 response";

function normalizeFlag(value: string | undefined) {
  return value?.trim().toLowerCase();
}

export function isExternalSyncDisabled() {
  return normalizeFlag(process.env.DISABLE_EXTERNAL_SYNC) === "true"
    || normalizeFlag(process.env.ENABLE_LOCALDATA_SYNC) === "false";
}

export function getExternalSyncDisabledReason() {
  return EXTERNAL_SYNC_DISABLED_REASON;
}