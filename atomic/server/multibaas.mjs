/**
 * Curvegrid MultiBaas client (REST, Bearer API key). Used for event monitoring / history.
 *
 * One-time MultiBaas setup (dashboard): import the AtomicMint ABI as contract label "atomicmint",
 * link the deployed address with the same alias on chain "ethereum" (MultiBaas' generic EVM path
 * segment, connected to Base Sepolia), and enable event monitoring for AtomicMinted.
 * NOTE: endpoint paths below follow the MultiBaas v0 API; confirm them against your deployment's
 * Swagger UI (<baseUrl>/api/v0/docs) if a call returns 404.
 */
export function createMultiBaas({ baseUrl, apiKey }, fetchImpl = fetch) {
  const call = async (path) => {
    const res = await fetchImpl(`${baseUrl}/api/v0${path}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`MultiBaas ${res.status}: ${body?.message || res.statusText}`);
    return body.result;
  };

  return {
    /** Latest AtomicMinted events emitted by the AtomicMint contract. */
    async listAtomicMinted({ alias = "atomicmint", limit = 20 } = {}) {
      const rows = await call(`/chains/ethereum/addresses/${encodeURIComponent(alias)}/events?limit=${Number(limit)}`);
      return normalizeEvents(rows);
    },
  };
}

export function normalizeEvents(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r) => {
      const ev = r.event || r;
      if (ev.name !== "AtomicMinted") return null;
      const arg = (n) => ev.inputs?.find((i) => i.name === n)?.value;
      return {
        to: arg("to"),
        tokenId: String(arg("tokenId")),
        sbtId: String(arg("sbtId")),
        tba: arg("tba"),
        uri: arg("uri"),
        txHash: r.transaction?.txHash || r.transaction?.hash || null,
        at: r.triggeredAt || null,
      };
    })
    .filter(Boolean);
}
