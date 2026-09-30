import crypto from "node:crypto";

const DOMAIN = Buffer.from("AW1|");
const HEX = /^[0-9a-f]+$/i;

/** MAC = HMAC-SHA256(secret, "AW1|" || deviceId(raw bytes) || challenge(32 bytes)). Must match firmware/pico_w/main.py */
export function computeMac(secret, deviceIdHex, challenge) {
  return crypto
    .createHmac("sha256", secret)
    .update(Buffer.concat([DOMAIN, Buffer.from(deviceIdHex, "hex"), challenge]))
    .digest();
}

export function createDeviceRegistry(store) {
  return {
    enroll(deviceId, secretHex) {
      if (!HEX.test(deviceId) || deviceId.length % 2 || deviceId.length < 8 || deviceId.length > 32) {
        throw new Error("invalid deviceId");
      }
      if (!HEX.test(secretHex) || secretHex.length !== 64) throw new Error("secret must be 32 bytes hex");
      store.saveDevice(deviceId, { secretHex: secretHex.toLowerCase(), enrolledAt: new Date().toISOString() });
    },
    verify(deviceId, challenge, macHex) {
      if (typeof deviceId !== "string" || !HEX.test(deviceId) || deviceId.length % 2) return false;
      if (typeof macHex !== "string" || !/^[0-9a-f]{64}$/i.test(macHex)) return false;
      const dev = store.getDevice(deviceId);
      if (!dev) return false;
      const expected = computeMac(Buffer.from(dev.secretHex, "hex"), deviceId, challenge);
      return crypto.timingSafeEqual(expected, Buffer.from(macHex, "hex"));
    },
  };
}
