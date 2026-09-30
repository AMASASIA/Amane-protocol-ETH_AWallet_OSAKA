import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createApp } from "../app.mjs";
import { createStore } from "../store.mjs";
import { computeMac } from "../devices.mjs";
import { testConfig, ALICE } from "./helpers.mjs";

const secretHex = crypto.randomBytes(32).toString("hex");
const deviceId = "e6614103e7a5a237";

async function boot({ tier = 2, webauthn } = {}) {
  const config = testConfig({ atomicMintTier: tier });
  const store = createStore(null);
  store.saveUser(ALICE, { address: ALICE.toLowerCase(), credentials: [{ id: "c", publicKey: "", counter: 0 }] });
  const mints = [];
  const pimlico = {
    issuerAddress: async () => "0x00000000000000000000000000000000000000AA",
    sendAtomicMint: async (to, uri) => {
      mints.push({ to, uri });
      return { userOpHash: "0x01", txHash: "0x02", to, tokenId: String(mints.length), sbtId: String(mints.length), tba: "0x1111111111111111111111111111111111111111", uri };
    },
  };
  const app = createApp(config, { store, pimlico, webauthn, reader: null });
  const server = await new Promise((r) => { const s = app.listen(0, () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, path, body, headers = {}) => {
    const res = await fetch(base + path, { method, headers: { "content-type": "application/json", ...headers }, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, body: await res.json() };
  };
  return { config, store, call, mints, close: () => server.close() };
}

const body = { kind: "atomic_mint", address: ALICE, tokenURI: "ipfs://demo/1.json" };

test("full flow at tier 2: approval -> Pico W device signature -> single atomic mint; replay blocked", async (t) => {
  const s = await boot({ tier: 2 }); t.after(s.close);
  await s.call("POST", "/api/devices/enroll", { deviceId, secret: secretHex }, { "x-admin-token": "admin-secret" });

  const created = await s.call("POST", "/api/approvals", body);
  assert.equal(created.status, 201);
  const { actionId, challengeHex } = created.body;

  // mint before approval must fail and must NOT reach the chain
  assert.equal((await s.call("POST", "/api/atomic/mint", { actionId })).status, 409);
  assert.equal(s.mints.length, 0);

  // wrong MAC
  const bad = await s.call("POST", `/api/approvals/${actionId}/device`, { deviceId, mac: "00".repeat(32) });
  assert.equal(bad.status, 403);

  const mac = computeMac(Buffer.from(secretHex, "hex"), deviceId, Buffer.from(challengeHex, "hex")).toString("hex");
  assert.equal((await s.call("POST", `/api/approvals/${actionId}/device`, { deviceId, mac })).status, 200);

  const minted = await s.call("POST", "/api/atomic/mint", { actionId });
  assert.equal(minted.status, 201);
  assert.equal(minted.body.approvedBy, "device");
  assert.equal(minted.body.tokenId, "1");
  assert.deepEqual(s.mints.map((m) => ({ to: m.to.toLowerCase(), uri: m.uri })), [{ to: ALICE.toLowerCase(), uri: "ipfs://demo/1.json" }]);

  // replay of the same approval and a fresh approval for the same address are both rejected
  assert.equal((await s.call("POST", "/api/atomic/mint", { actionId })).status, 409);
  assert.equal((await s.call("POST", "/api/approvals", body)).status, 409);
  assert.equal(s.mints.length, 1);
});

test("tier 3: hardware key alone is NOT enough", async (t) => {
  const s = await boot({ tier: 3 }); t.after(s.close);
  await s.call("POST", "/api/devices/enroll", { deviceId, secret: secretHex }, { "x-admin-token": "admin-secret" });
  const { body: c } = await s.call("POST", "/api/approvals", body);
  const mac = computeMac(Buffer.from(secretHex, "hex"), deviceId, Buffer.from(c.challengeHex, "hex")).toString("hex");
  assert.equal((await s.call("POST", `/api/approvals/${c.actionId}/device`, { deviceId, mac })).status, 403);
  assert.equal((await s.call("POST", "/api/atomic/mint", { actionId: c.actionId })).status, 409);
  assert.equal(s.mints.length, 0);
});

test("passkey approval path calls the server-side verifier", async (t) => {
  let verified = 0;
  const webauthn = { verifyAuthentication: async () => { verified++; return true; }, authenticationOptions: async (a) => ({ challenge: a.challenge.toString("base64url") }) };
  const s = await boot({ tier: 3, webauthn }); t.after(s.close);
  const { body: c } = await s.call("POST", "/api/approvals", body);
  assert.equal((await s.call("POST", `/api/approvals/${c.actionId}/passkey/options`)).status, 200);
  assert.equal((await s.call("POST", `/api/approvals/${c.actionId}/passkey/verify`, { response: {} })).status, 200);
  assert.equal(verified, 1);
  assert.equal((await s.call("POST", "/api/atomic/mint", { actionId: c.actionId })).body.approvedBy, "passkey");
});

test("input validation and access control", async (t) => {
  const s = await boot(); t.after(s.close);
  assert.equal((await s.call("POST", "/api/approvals", { ...body, tokenURI: "javascript:alert(1)" })).status, 400);
  assert.equal((await s.call("POST", "/api/approvals", { ...body, address: "nope" })).status, 400);
  assert.equal((await s.call("POST", "/api/approvals", { ...body, kind: "transfer_all" })).status, 403);
  assert.equal((await s.call("POST", "/api/approvals", { ...body, address: "0x0000000000000000000000000000000000000001" })).status, 403); // no passkey
  assert.equal((await s.call("POST", "/api/devices/enroll", { deviceId, secret: secretHex })).status, 401);
  assert.equal((await s.call("POST", "/api/devices/enroll", { deviceId, secret: secretHex }, { "x-admin-token": "wrong" })).status, 401);
  assert.equal((await s.call("GET", "/api/atomic/history")).status, 501);
  assert.equal((await s.call("GET", "/api/issuer")).body.issuer, "0x00000000000000000000000000000000000000AA");
});
