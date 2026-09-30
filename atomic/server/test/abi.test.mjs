import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { formatAbiItem } from "viem/utils";
import { atomicMintAbi } from "../abi.mjs";

const artifactPath = new URL("../../artifacts/contracts/AtomicMint.sol/AtomicMint.json", import.meta.url);

test("server ABI matches the compiled AtomicMint contract (run `npm run compile` first)", { skip: !fs.existsSync(artifactPath) }, () => {
  const compiled = JSON.parse(fs.readFileSync(artifactPath, "utf8")).abi;
  const sig = (i) => `${i.type}:${i.name}(${(i.inputs || []).map((x) => x.type).join(",")})->${(i.outputs || []).map((x) => x.type).join(",")}`;
  const have = new Set(compiled.map(sig));
  for (const item of atomicMintAbi) {
    assert.ok(have.has(sig(item)), `missing in contract: ${formatAbiItem(item)}`);
  }
});
