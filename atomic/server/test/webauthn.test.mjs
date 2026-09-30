import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createStore } from "../store.mjs";
import { createApprovals } from "../approvals.mjs";
import { createWebAuthn } from "../webauthn.mjs";
import { testConfig, ALICE } from "./helpers.mjs";

// Builds a REAL ES256 credential + assertion so the actual verifier code runs (no mocks).
const b64u = (b) => Buffer.from(b).toString("base64url");

function makeAuthenticator() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
  const jwk = publicKey.export({ format: "jwk" });
  const x = Buffer.from(jwk.x, "base64url"), y = Buffer.from(jwk.y, "base64url");
  const cose = Buffer.concat([Buffer.from("a50102032620012158", "hex"), Buffer.from([0x20]), x, Buffer.from("225820", "hex"), y]);
  // (a5 map(5): 1:2, 3:-7, -1:1, -2:bstr32 x, -3:bstr32 y)
  const credId = crypto.randomBytes(16);
  return { cose, credId, privateKey };
}

function assertion(auth, { challenge, origin, rpId, flags = 0x05, counter = 1, type = "webauthn.get" }) {
  const clientDataJSON = Buffer.from(JSON.stringify({ type, challenge: b64u(challenge), origin, crossOrigin: false }));
  const c = Buffer.alloc(4); c.writeUInt32BE(counter);
  const authData = Buffer.concat([crypto.createHash("sha256").update(rpId).digest(), Buffer.from([flags]), c]);
  const signature = crypto.sign("sha256", Buffer.concat([authData, crypto.createHash("sha256").update(clientDataJSON).digest()]), { key: auth.privateKey, dsaEncoding: "der" });
  return {
    id: b64u(auth.credId), rawId: b64u(auth.credId), type: "public-key", clientExtensionResults: {},
    response: { authenticatorData: b64u(authData), clientDataJSON: b64u(clientDataJSON), signature: b64u(signature) },
  };
}

function setup() {
  const config = testConfig();
  const store = createStore(null);
  const auth = makeAuthenticator();
  store.saveUser(ALICE, { address: ALICE.toLowerCase(), credentials: [{ id: b64u(auth.credId), publicKey: b64u(auth.cose), counter: 0, transports: [] }] });
  const approvals = createApprovals(config);
  const a = approvals.create({ kind: "atomic_mint", address: ALICE, payload: { tokenURI: "ipfs://x" } });
  return { config, store, auth, a, wa: createWebAuthn(config, store) };
}

const ok = (config) => ({ origin: config.allowedOrigin, rpId: config.rpId });

test("valid user-verified assertion over the action challenge is accepted and bumps the counter", async () => {
  const { config, auth, a, wa, store } = setup();
  assert.equal(await wa.verifyAuthentication(a, assertion(auth, { challenge: a.challenge, ...ok(config) })), true);
  assert.equal(store.getUser(ALICE).credentials[0].counter, 1);
});

test("assertion for a different challenge (other action) is rejected", async () => {
  const { config, auth, a, wa } = setup();
  await assert.rejects(wa.verifyAuthentication(a, assertion(auth, { challenge: Buffer.alloc(32, 1), ...ok(config) })), /assertion failed/);
});

test("wrong origin, wrong rpId, missing user verification are rejected", async () => {
  const { config, auth, a, wa } = setup();
  await assert.rejects(wa.verifyAuthentication(a, assertion(auth, { challenge: a.challenge, origin: "https://evil.example", rpId: config.rpId })), /assertion failed/);
  await assert.rejects(wa.verifyAuthentication(a, assertion(auth, { challenge: a.challenge, origin: config.allowedOrigin, rpId: "evil.example" })), /assertion failed/);
  await assert.rejects(wa.verifyAuthentication(a, assertion(auth, { challenge: a.challenge, ...ok(config), flags: 0x01 })), /assertion failed/); // UP only, no UV
});

test("signature from a different key is rejected", async () => {
  const { config, a, wa } = setup();
  const attacker = makeAuthenticator();
  attacker.credId = Buffer.from(Buffer.from(a.address)); // irrelevant; use victim credential id below
  const forged = assertion(attacker, { challenge: a.challenge, ...ok(config) });
  forged.id = forged.rawId = b64u(setup().auth.credId); // unknown credential id -> rejected
  await assert.rejects(wa.verifyAuthentication(a, forged), /unknown credential|assertion failed/);
});

test("forged signature under the victim's credential id is rejected", async () => {
  const { config, auth, a, wa } = setup();
  const attacker = makeAuthenticator();
  attacker.credId = auth.credId;
  await assert.rejects(wa.verifyAuthentication(a, assertion(attacker, { challenge: a.challenge, ...ok(config) })), /assertion (failed|not verified)/);
});

test("registration options are gated by the invite code and one passkey per address", async () => {
  const config = testConfig({ inviteCode: "letmein" });
  const store = createStore(null);
  const wa = createWebAuthn(config, store);
  await assert.rejects(wa.registrationOptions(ALICE, "nope"), /invite/);
  const opts = await wa.registrationOptions(ALICE, "letmein");
  assert.equal(opts.rp.id, "localhost");
  assert.equal(opts.authenticatorSelection.userVerification, "required");
  store.saveUser(ALICE, { credentials: [{ id: "x" }] });
  await assert.rejects(wa.registrationOptions(ALICE, "letmein"), /already registered/);
});
