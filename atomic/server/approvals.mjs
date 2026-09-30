import crypto from "node:crypto";
import { requiredTier, allowedMethods } from "./policy.mjs";

const TTL_MS = 120_000;

/**
 * Approval lifecycle:  pending --approve(method)--> approved --consume--> consumed
 * One challenge (32 bytes) binds the action content; it is used as the WebAuthn challenge and as
 * the Pico W device challenge. Every approval is single-use and expires after 120 s.
 */
export function createApprovals(config, now = () => Date.now()) {
  const items = new Map();

  const sweep = () => {
    for (const [id, a] of items) if (a.expiresAt < now() - TTL_MS) items.delete(id);
  };

  function get(id) {
    const a = items.get(id);
    if (!a) throw httpError(404, "approval not found");
    return a;
  }

  return {
    create({ kind, address, payload }) {
      sweep();
      const tier = requiredTier(kind, config);
      const methods = allowedMethods(tier);
      if (!methods.length) throw httpError(403, "action blocked by policy (tier 4)");

      const id = crypto.randomUUID();
      const nonce = crypto.randomBytes(16);
      const challenge = crypto
        .createHash("sha256")
        .update(JSON.stringify({ id, kind, address: address.toLowerCase(), payload }))
        .update(nonce)
        .digest();

      const a = {
        id, kind, address: address.toLowerCase(), payload, tier, methods, challenge,
        status: "pending", method: null, createdAt: now(), expiresAt: now() + TTL_MS,
      };
      items.set(id, a);
      return a;
    },

    get,

    approve(id, method) {
      const a = get(id);
      if (a.status !== "pending") throw httpError(409, `approval is ${a.status}`);
      if (a.expiresAt < now()) throw httpError(410, "approval expired");
      if (!a.methods.includes(method)) throw httpError(403, `method ${method} not allowed for tier ${a.tier}`);
      a.status = "approved";
      a.method = method;
      a.expiresAt = now() + TTL_MS;
      return a;
    },

    /** Marks an approved action as used. Synchronous => race free within one process. */
    consume(id, { kind, address }) {
      const a = get(id);
      if (a.status !== "approved") throw httpError(409, `approval is ${a.status}`);
      if (a.expiresAt < now()) throw httpError(410, "approval expired");
      if (a.kind !== kind || a.address !== address.toLowerCase()) throw httpError(403, "approval mismatch");
      a.status = "consumed";
      return a;
    },
  };
}

export function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}
