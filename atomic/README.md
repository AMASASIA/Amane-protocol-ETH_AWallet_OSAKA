# AWallet – Atomic (NFT + SBT + ERC-6551 TBA) demo on Base Sepolia

One UserOperation (ERC-4337, Pimlico bundler + paymaster) calls `AtomicMint.atomicMint(to, uri)`, which in a single
all-or-nothing transaction mints **NFT + SBT + a real ERC-6551 token-bound account**. Approval is Tier 3 (passkey) or,
if `ATOMIC_MINT_TIER=2`, passkey **or** the Pico W hardware key. All approval checks run on the server.

```
contracts/    AtomicMint, SBT, TBAFactory, erc6551/{ERC6551Registry, AWalletTBA, IERC6551}
scripts/      deploy.js  (Base Sepolia deploy + wiring + Basescan/Etherscan-V2 verify)
test/         Hardhat tests (13)
server/       Express API: WebAuthn, approvals, Pico W HMAC, Pimlico, MultiBaas  (+ node:test, 23)
firmware/     pico_w/main.py + hmac_util.py (MicroPython BLE key) + test_hmac_util.py
frontend/src/ drop-in files: AtomicMintSheet, atomicApi, picoBle + patched copies of your components
```

## 1. Setup
```bash
npm ci
cp .env.example .env            # fill in
npm run compile && npm test && npm run test:server
python3 firmware/pico_w/test_hmac_util.py
```
Offline sandboxes that cannot download solc: `USE_SOLCJS=1 npm test` (uses the pinned `solc` npm package).

## 2. Deploy (Base Sepolia, chainId 84532)
1. Start the server once (`npm run server`) with `PIMLICO_API_KEY` + `ISSUER_PRIVATE_KEY` set, then `GET /api/issuer`
   → the **issuer smart-account address**. Put it in `.env` as `ISSUER_ADDRESS`.
2. `npm run deploy:sepolia`. The script uses the canonical ERC-6551 registry
   (`0x000000006551c19487814612e58FE06813775758`) if it has code on the chain, otherwise deploys a compatible one; deploys
   account implementation, `TBAFactory`, `SBT`, `AtomicMint`; sets `SBT.minter = AtomicMint`; transfers
   `AtomicMint` ownership to `ISSUER_ADDRESS`; verifies on Basescan when `ETHERSCAN_API_KEY` is set
   (Etherscan API **V2** key; the old per-explorer Basescan V1 API is retired).
3. Copy the printed `ATOMIC_MINT_ADDRESS / SBT_ADDRESS / TBA_FACTORY_ADDRESS` into `.env`. Restart the server.

Demo rules enforced on-chain: `SBT.MAX_MEMBERS = 20`, one SBT per address, only `AtomicMint` can mint SBTs,
SBTs cannot be transferred or burned (ERC-5192), only the owner (issuer) can call `atomicMint`.
`AtomicMint` uses `_safeMint`: a recipient smart account must implement `onERC721Received`.

## 3. MultiBaas (event monitoring / history)
Dashboard: import the `AtomicMint` ABI (from `artifacts/`), link the deployed address with alias `atomicmint`, enable
event monitoring for `AtomicMinted`. Set `MULTIBAAS_BASE_URL` / `MULTIBAAS_API_KEY`. `GET /api/atomic/history` reads
the events. The issuance response itself never depends on MultiBaas (it comes from the UserOperation receipt).
Confirm the endpoint path in `<baseUrl>/api/v0/docs` if you get a 404 (see `server/multibaas.mjs`).

## 4. Pico W key
1. Flash MicroPython (>= 1.22, Pico W). Copy `main.py` and `hmac_util.py` (e.g. `mpremote cp`). Button between **GP15 and GND**.
2. First boot prints `ENROLL deviceId=… secret=…` on the USB serial once. Enroll it:
   `curl -X POST $SERVER/api/devices/enroll -H "X-Admin-Token: $ADMIN_TOKEN" -H "content-type: application/json" -d '{"deviceId":"…","secret":"…"}'`
3. Set `ATOMIC_MINT_TIER=2` to accept the key. Web Bluetooth needs Chrome/Edge over https or localhost.
Protocol: phone writes the 32-byte action challenge; user releases + presses GP15 within 30 s; device notifies
`HMAC-SHA256(secret, "AW1|" + deviceId + challenge)` (+ its id); the server verifies. Challenges are single-use and expire in 120 s.

## 5. Frontend integration
`npm i @simplewebauthn/browser@13.2.2`, set `VITE_API_BASE`, and copy `frontend/src/**` over your project
(new: `AtomicMintSheet`, `atomicApi`, `picoBle`; patched: `NFTCard`, `TokenRow`, `SendSheet`, `SwapSheet`,
`BiometricAuthModal`, `InvisibleFinanceView`).

```tsx
{showAtomic && <AtomicMintSheet userAddress={address} onClose={() => setShowAtomic(false)} />}

<InvisibleFinanceView … onAuthenticate={async (a) => { const t = await createApproval(address, uri); await approveWithPasskey(t); }} />
```
* Fallback prices now live only in `NFTCard.tsx` (`getTokenPriceUsd`); the other components import it.
* `BiometricAuthModal` no longer simulates success and has no passcode bypass: `authenticate` is a required prop and
  must reject on failure. `InvisibleFinanceView` passes it through as `onAuthenticate`.
* `onApproveAction(id, viaTap=true)` in your parent **must** run `requestPicoApproval` + the server call; never trust the flag.

## 6. Not verified here / known limits
* Not run against live Pimlico, MultiBaas, a real browser authenticator, or physical Pico W hardware (no network access
  or hardware in the build environment). Everything else is covered by the tests above.
* The Pico W MAC uses a per-device symmetric secret (stock MicroPython has no ECDSA), stored unencrypted in flash, and the key
  has no display, so it cannot show what it approves. Treat it as a presence check, not a hardware wallet.
* Passkey registration is gated only by `DEMO_INVITE_CODE`; the first registrant of an address owns it.
* Out of scope and unchanged: client-side `evaluateTransactionPolicy` in Send/Swap is advisory only (enforce server-side/on-chain
  before mainnet); `SlideToConfirm` shows "Verified" as soon as the biometric modal opens for Tier 3/5 actions; SendSheet's
  "Tier 3 passkey" badge does not yet call the passkey flow.
