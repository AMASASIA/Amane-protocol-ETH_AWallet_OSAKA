import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createStore } from "../store.mjs";
import { createDeviceRegistry, computeMac } from "../devices.mjs";

const secretHex = crypto.randomBytes(32).toString("hex");
const deviceId = "e6614103e7a5a237";
const challenge = crypto.randomBytes(32);

function setup() {
  const reg = createDeviceRegistry(createStore(null));
  reg.enroll(deviceId, secretHex);
  return reg;
}

test("valid MAC verifies; tampered challenge / MAC / unknown device do not", () => {
  const reg = setup();
  const mac = computeMac(Buffer.from(secretHex, "hex"), deviceId, challenge).toString("hex");
  assert.equal(reg.verify(deviceId, challenge, mac), true);
  assert.equal(reg.verify(deviceId, crypto.randomBytes(32), mac), false);
  assert.equal(reg.verify(deviceId, challenge, mac.replace(/^./, mac[0] === "0" ? "1" : "0")), false);
  assert.equal(reg.verify("aaaaaaaaaaaaaaaa", challenge, mac), false);
  assert.equal(reg.verify(deviceId, challenge, "zz"), false);
  assert.equal(reg.verify(deviceId, challenge, undefined), false);
});

test("MAC from another device secret is rejected", () => {
  const reg = setup();
  const other = computeMac(crypto.randomBytes(32), deviceId, challenge).toString("hex");
  assert.equal(reg.verify(deviceId, challenge, other), false);
});

test("enroll validates input", () => {
  const reg = createDeviceRegistry(createStore(null));
  assert.throws(() => reg.enroll("xyz", secretHex), /invalid deviceId/);
  assert.throws(() => reg.enroll(deviceId, "abcd"), /32 bytes/);
});
