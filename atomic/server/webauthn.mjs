import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { isAddress } from "viem";
import { httpError } from "./approvals.mjs";

const b64u = {
  enc: (buf) => Buffer.from(buf).toString("base64url"),
  dec: (s) => new Uint8Array(Buffer.from(s, "base64url")),
};

/** Passkey registration + assertion verification. All verification happens here, on the server. */
export function createWebAuthn(config, store, now = () => Date.now()) {
  const regChallenges = new Map(); // address -> { challenge, exp }

  return {
    async registrationOptions(address, inviteCode) {
      if (!isAddress(address)) throw httpError(400, "invalid address");
      if (config.inviteCode && inviteCode !== config.inviteCode) throw httpError(403, "invalid invite code");
      if (store.getUser(address)?.credentials?.length) throw httpError(409, "passkey already registered for this address");

      const options = await generateRegistrationOptions({
        rpName: config.rpName,
        rpID: config.rpId,
        userName: address.toLowerCase(),
        userDisplayName: `${address.slice(0, 6)}…${address.slice(-4)}`,
        userID: new TextEncoder().encode(address.toLowerCase()),
        attestationType: "none",
        authenticatorSelection: { residentKey: "preferred", userVerification: "required" },
      });
      regChallenges.set(address.toLowerCase(), { challenge: options.challenge, exp: now() + 120_000 });
      return options;
    },

    async verifyRegistration(address, response) {
      if (!isAddress(address)) throw httpError(400, "invalid address");
      const pending = regChallenges.get(address.toLowerCase());
      if (!pending || pending.exp < now()) throw httpError(400, "registration challenge missing or expired");
      regChallenges.delete(address.toLowerCase());

      const v = await verifyRegistrationResponse({
        response,
        expectedChallenge: pending.challenge,
        expectedOrigin: config.allowedOrigin,
        expectedRPID: config.rpId,
        requireUserVerification: true,
      }).catch((e) => {
        throw httpError(400, `registration failed: ${e.message}`);
      });
      if (!v.verified) throw httpError(400, "registration not verified");

      const { credential } = v.registrationInfo;
      store.saveUser(address, {
        address: address.toLowerCase(),
        credentials: [
          {
            id: credential.id,
            publicKey: b64u.enc(credential.publicKey),
            counter: credential.counter,
            transports: credential.transports || [],
          },
        ],
        createdAt: new Date().toISOString(),
      });
      return { verified: true, credentialId: credential.id };
    },

    async authenticationOptions(approval) {
      const user = store.getUser(approval.address);
      if (!user?.credentials?.length) throw httpError(404, "no passkey registered for this address");
      return generateAuthenticationOptions({
        rpID: config.rpId,
        challenge: approval.challenge, // the action-bound challenge
        allowCredentials: user.credentials.map((c) => ({ id: c.id, transports: c.transports })),
        userVerification: "required",
      });
    },

    async verifyAuthentication(approval, response) {
      const user = store.getUser(approval.address);
      const cred = user?.credentials?.find((c) => c.id === response?.id);
      if (!cred) throw httpError(403, "unknown credential");

      const v = await verifyAuthenticationResponse({
        response,
        expectedChallenge: b64u.enc(approval.challenge),
        expectedOrigin: config.allowedOrigin,
        expectedRPID: config.rpId,
        credential: { id: cred.id, publicKey: b64u.dec(cred.publicKey), counter: cred.counter, transports: cred.transports },
        requireUserVerification: true,
      }).catch((e) => {
        throw httpError(403, `assertion failed: ${e.message}`);
      });
      if (!v.verified) throw httpError(403, "assertion not verified");

      cred.counter = v.authenticationInfo.newCounter;
      store.saveUser(approval.address, user);
      return true;
    },
  };
}
