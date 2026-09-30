import test from "node:test";
import assert from "node:assert/strict";
import { encodeAbiParameters, encodeEventTopics, getAddress } from "viem";
import { atomicMintAbi } from "../abi.mjs";
import { parseMintResult } from "../pimlico.mjs";

const AM = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const TO = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const TBA = "0x1111111111111111111111111111111111111111";

function log(address) {
  return {
    address,
    topics: encodeEventTopics({ abi: atomicMintAbi, eventName: "AtomicMinted", args: { to: TO, tokenId: 7n } }),
    data: encodeAbiParameters([{ type: "uint256" }, { type: "address" }, { type: "string" }], [3n, TBA, "ipfs://demo"]),
    blockNumber: 1n, transactionHash: "0x" + "ab".repeat(32), transactionIndex: 0, blockHash: "0x" + "cd".repeat(32), logIndex: 0, removed: false,
  };
}

test("parseMintResult extracts tokenId / sbtId / tba / uri", () => {
  const r = parseMintResult([log(AM)], AM);
  assert.deepEqual(r, { to: getAddress(TO), tokenId: "7", sbtId: "3", tba: getAddress(TBA), uri: "ipfs://demo" });
});

test("events from other contracts are ignored; zero events is an error", () => {
  assert.throws(() => parseMintResult([log("0x2222222222222222222222222222222222222222")], AM), /got 0/);
  assert.throws(() => parseMintResult([], AM), /got 0/);
});
