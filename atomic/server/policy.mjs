/**
 * Server-side policy: the server (never the client) decides which approval methods are acceptable.
 *   Tier 2: hardware key (Pico W) OR passkey
 *   Tier 3: passkey (user verification required)
 * Tier 4 (blocked) is any unknown action kind.
 */
export const METHODS_BY_TIER = { 2: ["device", "passkey"], 3: ["passkey"] };

export function requiredTier(kind, config) {
  if (kind === "atomic_mint") return config.atomicMintTier;
  return 4;
}

export function allowedMethods(tier) {
  return METHODS_BY_TIER[tier] || [];
}
