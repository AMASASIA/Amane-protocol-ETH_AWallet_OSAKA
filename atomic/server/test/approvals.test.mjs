import test from "node:test";
import assert from "node:assert/strict";
import { createApprovals } from "../approvals.mjs";
import { testConfig, ALICE } from "./helpers.mjs";

const mk = (tier = 3, clock = { t: 1_000 }) => ({ clock, svc: createApprovals(testConfig({ atomicMintTier: tier }), () => clock.t) });
const req = { kind: "atomic_mint", address: ALICE, payload: { tokenURI: "ipfs://x" } };

test("tier 3 accepts only passkey; tier 2 accepts device or passkey", () => {
  const t3 = mk(3).svc.create(req);
  assert.deepEqual(t3.methods, ["passkey"]);
  const { svc } = mk(2);
  assert.deepEqual(svc.create(req).methods, ["device", "passkey"]);
});

test("unknown action kinds are blocked (tier 4)", () => {
  assert.throws(() => mk().svc.create({ ...req, kind: "send_all" }), /blocked by policy/);
});

test("device approval is rejected at tier 3", () => {
  const { svc } = mk(3);
  const a = svc.create(req);
  assert.throws(() => svc.approve(a.id, "device"), /not allowed/);
});

test("consume requires approval, matches kind+address, and is single use", () => {
  const { svc } = mk(2);
  const a = svc.create(req);
  assert.throws(() => svc.consume(a.id, { kind: "atomic_mint", address: ALICE }), /pending/);
  svc.approve(a.id, "device");
  assert.throws(() => svc.consume(a.id, { kind: "atomic_mint", address: "0x0000000000000000000000000000000000000001" }), /mismatch/);
  svc.consume(a.id, { kind: "atomic_mint", address: ALICE });
  assert.throws(() => svc.consume(a.id, { kind: "atomic_mint", address: ALICE }), /consumed/); // replay
  assert.throws(() => svc.approve(a.id, "passkey"), /consumed/);
});

test("approvals expire", () => {
  const { svc, clock } = mk(2);
  const a = svc.create(req);
  clock.t += 121_000;
  assert.throws(() => svc.approve(a.id, "device"), /expired/);
  const b = svc.create(req);
  svc.approve(b.id, "device");
  clock.t += 121_000;
  assert.throws(() => svc.consume(b.id, { kind: "atomic_mint", address: ALICE }), /expired/);
});

test("challenge is 32 bytes, unique and bound to the payload", () => {
  const { svc } = mk();
  const a = svc.create(req), b = svc.create(req), c = svc.create({ ...req, payload: { tokenURI: "ipfs://y" } });
  assert.equal(a.challenge.length, 32);
  assert.notDeepEqual(a.challenge, b.challenge);
  assert.notDeepEqual(a.challenge, c.challenge);
});
