import test from "node:test";
import assert from "node:assert/strict";
import { computeMac } from "../devices.mjs";

// Same constant is asserted by firmware/pico_w/test_hmac_util.py (MicroPython-compatible code).
test("server MAC equals the Pico W firmware test vector", () => {
  const secret = Buffer.from("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff", "hex");
  const challenge = Buffer.from(Array.from({ length: 32 }, (_, i) => i));
  assert.equal(computeMac(secret, "e6614103e7a5a237", challenge).toString("hex"), "c724c5214fed46bb23801b97ecc66319c0306ba0ab5f909de208869c4a99dea8");
});
