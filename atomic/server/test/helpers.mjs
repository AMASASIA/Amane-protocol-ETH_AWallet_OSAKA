import { loadConfig } from "../config.mjs";

export const ALICE = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
export const testConfig = (o = {}) =>
  loadConfig({
    dataFile: null,
    inviteCode: "",
    adminToken: "admin-secret",
    rpId: "localhost",
    allowedOrigin: "http://localhost:5173",
    atomicMintTier: 3,
    contracts: { atomicMint: "0x000000000000000000000000000000000000dEaD", sbt: "", tbaFactory: "" },
    ...o,
  });
