import { createPublicClient, http, encodeFunctionData, parseEventLogs, getAddress } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import { entryPoint07Address } from "viem/account-abstraction";
import { createSmartAccountClient } from "permissionless";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { atomicMintAbi } from "./abi.mjs";

const entryPoint = { address: entryPoint07Address, version: "0.7" };

/** Pure helper (unit tested): extract the AtomicMinted event from receipt logs. */
export function parseMintResult(logs, atomicMintAddress) {
  const events = parseEventLogs({ abi: atomicMintAbi, eventName: "AtomicMinted", logs }).filter(
    (l) => l.address.toLowerCase() === atomicMintAddress.toLowerCase(),
  );
  if (events.length !== 1) throw new Error(`expected exactly one AtomicMinted event, got ${events.length}`);
  const { to, tokenId, sbtId, tba, uri } = events[0].args;
  return { to, tokenId: tokenId.toString(), sbtId: sbtId.toString(), tba, uri };
}

/**
 * Issuer = ERC-4337 SimpleAccount (EntryPoint v0.7) owned by ISSUER_PRIVATE_KEY.
 * That smart account must be the AtomicMint owner (scripts/deploy.js ISSUER_ADDRESS).
 * Gas is paid by the Pimlico paymaster (verifying paymaster, optional sponsorship policy).
 */
export function createPimlico(config) {
  const url = `https://api.pimlico.io/v2/${baseSepolia.id}/rpc?apikey=${config.pimlico.apiKey}`;
  const publicClient = createPublicClient({ chain: baseSepolia, transport: http(config.rpcUrl) });
  const pimlicoClient = createPimlicoClient({ transport: http(url), entryPoint });

  let clientPromise;
  const getClient = () =>
    (clientPromise ??= (async () => {
      const account = await toSimpleSmartAccount({
        client: publicClient,
        owner: privateKeyToAccount(config.pimlico.issuerPrivateKey),
        entryPoint,
      });
      const smartAccountClient = createSmartAccountClient({
        account,
        chain: baseSepolia,
        bundlerTransport: http(url),
        paymaster: pimlicoClient,
        paymasterContext: config.pimlico.sponsorshipPolicyId
          ? { sponsorshipPolicyId: config.pimlico.sponsorshipPolicyId }
          : undefined,
        userOperation: { estimateFeesPerGas: async () => (await pimlicoClient.getUserOperationGasPrice()).fast },
      });
      return { account, smartAccountClient };
    })());

  return {
    publicClient,
    async issuerAddress() {
      return (await getClient()).account.address;
    },
    async sendAtomicMint(to, uri) {
      const { smartAccountClient } = await getClient();
      const data = encodeFunctionData({ abi: atomicMintAbi, functionName: "atomicMint", args: [getAddress(to), uri] });
      const userOpHash = await smartAccountClient.sendUserOperation({
        calls: [{ to: getAddress(config.contracts.atomicMint), value: 0n, data }],
      });
      const r = await smartAccountClient.waitForUserOperationReceipt({ hash: userOpHash, timeout: 90_000 });
      if (!r.success) throw new Error(`UserOperation reverted: ${r.reason || "unknown reason"}`);
      return {
        userOpHash,
        txHash: r.receipt.transactionHash,
        ...parseMintResult(r.receipt.logs, config.contracts.atomicMint),
      };
    },
  };
}
