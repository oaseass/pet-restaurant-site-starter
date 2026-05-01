import { normalizeAddress } from "@/lib/address";

export function normalizeSourceAddress(value?: string | null) {
  return normalizeAddress(value ?? "");
}