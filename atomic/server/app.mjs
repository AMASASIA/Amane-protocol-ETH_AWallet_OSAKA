import express from "express";
import { isAddress, getAddress, createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { createStore } from "./store.mjs";
import { createApprovals, httpError } from "./approvals.mjs";
import { createDeviceRegistry } from "./devices.mjs";
import { createWebAuthn } from "./webauthn.mjs";
import { isPimlicoReady, isMultiBaasReady } from "./config.mjs";
import { createPimlico } from "./pimlico.mjs";
import { createMultiBaas } from "./multibaas.mjs";
import { atomicMintAbi } from "./abi.mjs";

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const URI_RE = /^(ipfs:\/\/|https:\/\/)[^\s]{1,500}$/;

/** Builds the Express app. Dependencies are injectable so the whole flow is testable offline. */
export function createApp(config, deps = {}) {
  const store = deps.store || createStore(config.dataFile);
  const approvals = deps.approvals || createApprovals(config);
  const devices = deps.devices || createDeviceRegistry(store);
  const webauthn = deps.webauthn || createWebAuthn(config, store);
  const pimlico = deps.pimlico || (isPimlicoReady(config) ? createPimlico(config) : null);
  const multibaas = deps.multibaas || (isMultiBaasReady(config) ? createMultiBaas(config.multibaas) : null);
  const reader =
    deps.reader ||
    (config.contracts.atomicMint
      ? createPublicClient({ chain: baseSepolia, transport: http(config.rpcUrl) })
      : null);

  // Minting is serialized: one UserOperation at a time avoids nonce races on the issuer account.
  let mintQueue = Promise.resolve();
  const serial = (fn) => {
    const run = mintQueue.then(fn, fn);
    mintQueue = run.catch(() => {});
    return run;
  };

  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", config.allowedOrigin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Token");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  const addr = (v) => {
    if (typeof v !== "string" || !isAddress(v)) throw httpError(400, "invalid address");
    return getAddress(v);
  };

  app.get("/api/health", (_req, res) =>
    res.json({
      ok: true,
      chainId: baseSepolia.id,
      pimlico: Boolean(pimlico),
      multibaas: Boolean(multibaas),
      contracts: config.contracts,
      atomicMintTier: config.atomicMintTier,
    }),
  );

  app.get("/api/issuer", wrap(async (_req, res) => {
    if (!pimlico) throw httpError(503, "Pimlico is not configured");
    res.json({ issuer: await pimlico.issuerAddress() });
  }));

  // ---- Passkey registration ----
  app.post("/api/webauthn/register/options", wrap(async (req, res) => {
    res.json(await webauthn.registrationOptions(addr(req.body?.address), req.body?.inviteCode));
  }));
  app.post("/api/webauthn/register/verify", wrap(async (req, res) => {
    res.json(await webauthn.verifyRegistration(addr(req.body?.address), req.body?.response));
  }));

  app.get("/api/users/:address", (req, res) => {
    const a = addr(req.params.address);
    const user = store.getUser(a);
    res.json({ registered: Boolean(user?.credentials?.length), minted: store.getMint(a) });
  });

  // ---- Approvals (server decides tier + allowed methods) ----
  app.post("/api/approvals", wrap(async (req, res) => {
    const { kind, tokenURI } = req.body || {};
    const address = addr(req.body?.address);
    if (kind !== "atomic_mint") throw httpError(403, "unsupported action kind");
    if (typeof tokenURI !== "string" || !URI_RE.test(tokenURI)) throw httpError(400, "tokenURI must be an ipfs:// or https:// URI");
    if (!store.getUser(address)?.credentials?.length) throw httpError(403, "register a passkey first");
    if (store.getMint(address)) throw httpError(409, "already issued for this address");

    const a = approvals.create({ kind, address, payload: { tokenURI } });
    res.status(201).json({
      actionId: a.id,
      tier: a.tier,
      methods: a.methods,
      challengeHex: a.challenge.toString("hex"), // for the Pico W (Web Bluetooth) flow
      expiresInMs: a.expiresAt - a.createdAt,
    });
  }));

  app.post("/api/approvals/:id/passkey/options", wrap(async (req, res) => {
    const a = approvals.get(req.params.id);
    if (a.status !== "pending" || !a.methods.includes("passkey")) throw httpError(409, "passkey not available for this approval");
    res.json(await webauthn.authenticationOptions(a));
  }));

  app.post("/api/approvals/:id/passkey/verify", wrap(async (req, res) => {
    const a = approvals.get(req.params.id);
    if (a.status !== "pending") throw httpError(409, `approval is ${a.status}`);
    await webauthn.verifyAuthentication(a, req.body?.response);
    approvals.approve(a.id, "passkey");
    res.json({ approved: true, method: "passkey" });
  }));

  app.post("/api/approvals/:id/device", wrap(async (req, res) => {
    const a = approvals.get(req.params.id);
    if (a.status !== "pending") throw httpError(409, `approval is ${a.status}`);
    if (!a.methods.includes("device")) throw httpError(403, "hardware key not accepted at this tier");
    if (!devices.verify(req.body?.deviceId, a.challenge, req.body?.mac)) throw httpError(403, "invalid device signature");
    approvals.approve(a.id, "device");
    res.json({ approved: true, method: "device" });
  }));

  app.post("/api/devices/enroll", wrap(async (req, res) => {
    if (!config.adminToken || req.get("X-Admin-Token") !== config.adminToken) throw httpError(401, "unauthorized");
    try {
      devices.enroll(String(req.body?.deviceId || ""), String(req.body?.secret || ""));
    } catch (e) {
      throw httpError(400, e.message);
    }
    res.status(201).json({ enrolled: true });
  }));

  // ---- Issuance: NFT + SBT + TBA in ONE UserOperation ----
  app.post("/api/atomic/mint", wrap(async (req, res) => {
    if (!pimlico) throw httpError(503, "Pimlico is not configured");
    const a = approvals.get(String(req.body?.actionId || ""));
    if (store.getMint(a.address)) throw httpError(409, "already issued for this address");
    approvals.consume(a.id, { kind: "atomic_mint", address: a.address });

    const result = await serial(() => pimlico.sendAtomicMint(a.address, a.payload.tokenURI));
    const record = { ...result, approvedBy: a.method, at: new Date().toISOString() };
    store.saveMint(a.address, record);
    res.status(201).json(record);
  }));

  app.get("/api/atomic/history", wrap(async (_req, res) => {
    if (!multibaas) throw httpError(501, "MultiBaas is not configured");
    res.json({ events: await multibaas.listAtomicMinted({ limit: 20 }) });
  }));

  app.get("/api/atomic/:tokenId", wrap(async (req, res) => {
    if (!reader) throw httpError(503, "ATOMIC_MINT_ADDRESS is not configured");
    if (!/^\d{1,12}$/.test(req.params.tokenId)) throw httpError(400, "invalid tokenId");
    const id = BigInt(req.params.tokenId);
    const c = { address: config.contracts.atomicMint, abi: atomicMintAbi };
    const [owner, tba, sbtId, uri] = await Promise.all([
      reader.readContract({ ...c, functionName: "ownerOf", args: [id] }),
      reader.readContract({ ...c, functionName: "tbaOf", args: [id] }),
      reader.readContract({ ...c, functionName: "sbtOf", args: [id] }),
      reader.readContract({ ...c, functionName: "tokenURI", args: [id] }),
    ]);
    res.json({ tokenId: req.params.tokenId, owner, tba, sbtId: sbtId.toString(), uri });
  }));

  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? "internal error" : err.message });
  });

  return app;
}
