import "dotenv/config";

const env = process.env;

export const BASE_SEPOLIA_CHAIN_ID = 84532;

export function loadConfig(overrides = {}) {
  const tier = Number(env.ATOMIC_MINT_TIER || 3);
  if (![2, 3].includes(tier)) throw new Error("ATOMIC_MINT_TIER must be 2 or 3");
  return {
    port: Number(env.PORT || 8787),
    allowedOrigin: env.ALLOWED_ORIGIN || "http://localhost:5173",
    rpId: env.WEBAUTHN_RP_ID || "localhost",
    rpName: env.WEBAUTHN_RP_NAME || "AWallet Demo",
    inviteCode: env.DEMO_INVITE_CODE || "",
    adminToken: env.ADMIN_TOKEN || "",
    atomicMintTier: tier,
    rpcUrl: env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    contracts: {
      atomicMint: env.ATOMIC_MINT_ADDRESS || "",
      sbt: env.SBT_ADDRESS || "",
      tbaFactory: env.TBA_FACTORY_ADDRESS || "",
    },
    pimlico: {
      apiKey: env.PIMLICO_API_KEY || "",
      issuerPrivateKey: env.ISSUER_PRIVATE_KEY || "",
      sponsorshipPolicyId: env.SPONSORSHIP_POLICY_ID || "",
    },
    multibaas: {
      baseUrl: (env.MULTIBAAS_BASE_URL || "").replace(/\/+$/, ""),
      apiKey: env.MULTIBAAS_API_KEY || "",
    },
    dataFile: env.DATA_FILE || new URL("./data/store.json", import.meta.url).pathname,
    ...overrides,
  };
}

export const isPimlicoReady = (c) => Boolean(c.pimlico.apiKey && c.pimlico.issuerPrivateKey && c.contracts.atomicMint);
export const isMultiBaasReady = (c) => Boolean(c.multibaas.baseUrl && c.multibaas.apiKey);
