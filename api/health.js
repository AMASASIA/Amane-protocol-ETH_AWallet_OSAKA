// GET /health -> JSON health (Vercel Function). Only booleans and PUBLIC addresses are exposed; never secrets.
async function handler(req, res) {
  const env = process.env;
  const out = {
    ok: true,
    service: 'awallet',
    network: 'base-sepolia',
    chainId: 84532,
    time: new Date().toISOString(),
    commit: (env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7) || null,
    contracts: {
      atomicMint: env.ATOMIC_MINT_ADDRESS || null,
      sbt: env.SBT_ADDRESS || null,
      tbaFactory: env.TBA_FACTORY_ADDRESS || null,
    },
    api: { configured: Boolean(env.AWALLET_API_URL), reachable: null },
  };
  if (env.AWALLET_API_URL) {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 4000);
      const r = await fetch(new URL('/api/health', env.AWALLET_API_URL), { signal: ctl.signal });
      clearTimeout(timer);
      const j = await r.json();
      out.api = { configured: true, reachable: r.ok, pimlico: j.pimlico, multibaas: j.multibaas, atomicMintTier: j.atomicMintTier };
      if (!r.ok) out.ok = false;
    } catch (e) {
      out.api = { configured: true, reachable: false };
      out.ok = false;
    }
  }
  res.setHeader('Cache-Control', 'no-store');
  res.status(out.ok ? 200 : 503).json(out);
}
export default handler;
