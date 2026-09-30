/**
 * Deploys the Atomic stack and wires it together.
 *
 *   npx hardhat run scripts/deploy.js --network baseSepolia
 *
 * Env:
 *   PRIVATE_KEY           deployer key (funded with Base Sepolia ETH)
 *   ISSUER_ADDRESS        (optional) address that becomes AtomicMint owner, i.e. the Pimlico
 *                         smart account of the server (GET /api/issuer prints it). Default: deployer.
 *   ETHERSCAN_API_KEY     (optional) enables automatic verification (Etherscan API V2 key)
 */
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const CANONICAL_ERC6551_REGISTRY = "0x000000006551c19487814612e58FE06813775758";

async function deploy(name, args = []) {
  const factory = await hre.ethers.getContractFactory(name);
  const contract = await factory.deploy(...args);
  await contract.waitForDeployment();
  console.log(`  ${name.padEnd(16)} ${contract.target}`);
  return contract;
}

async function verify(address, constructorArguments) {
  try {
    await hre.run("verify:verify", { address, constructorArguments });
  } catch (e) {
    if (/already verified/i.test(e.message)) return console.log(`  verified (already): ${address}`);
    console.warn(`  ! verify failed for ${address}: ${e.message.split("\n")[0]}`);
  }
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const net = await hre.ethers.provider.getNetwork();
  const isRemote = hre.network.name === "baseSepolia";
  if (isRemote && net.chainId !== 84532n) throw new Error(`Unexpected chainId ${net.chainId}`);

  console.log(`Network ${hre.network.name} (chainId ${net.chainId}) deployer ${deployer.address}`);

  // 1) ERC-6551 registry: use the canonical one if present, otherwise deploy a compatible one.
  let registryAddress = CANONICAL_ERC6551_REGISTRY;
  const canonicalCode = await hre.ethers.provider.getCode(CANONICAL_ERC6551_REGISTRY);
  let registryDeployed = false;
  if (canonicalCode === "0x") {
    console.log("Canonical ERC-6551 registry not found on this chain -> deploying compatible registry");
    registryAddress = (await deploy("ERC6551Registry")).target;
    registryDeployed = true;
  } else {
    console.log(`Using canonical ERC-6551 registry ${registryAddress}`);
  }

  console.log("Deploying:");
  const impl = await deploy("AWalletTBA");
  const factory = await deploy("TBAFactory", [registryAddress, impl.target]);
  const sbt = await deploy("SBT");
  const atomic = await deploy("AtomicMint", [sbt.target, factory.target]);

  console.log("Wiring:");
  await (await sbt.setMinter(atomic.target)).wait();
  console.log("  SBT.minter = AtomicMint");

  const issuer = process.env.ISSUER_ADDRESS;
  if (issuer && issuer.toLowerCase() !== deployer.address.toLowerCase()) {
    await (await atomic.transferOwnership(issuer)).wait();
    console.log(`  AtomicMint.owner = ${issuer}`);
  }

  const out = {
    network: hre.network.name,
    chainId: Number(net.chainId),
    deployer: deployer.address,
    owner: issuer || deployer.address,
    erc6551Registry: registryAddress,
    erc6551RegistryDeployedByUs: registryDeployed,
    accountImplementation: impl.target,
    tbaFactory: factory.target,
    sbt: sbt.target,
    atomicMint: atomic.target,
  };
  fs.mkdirSync(path.join(__dirname, "..", "deployments"), { recursive: true });
  const file = path.join(__dirname, "..", "deployments", `${hre.network.name}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log(`\nSaved ${file}`);

  console.log("\n# --- paste into .env ---");
  console.log(`ATOMIC_MINT_ADDRESS=${atomic.target}`);
  console.log(`SBT_ADDRESS=${sbt.target}`);
  console.log(`TBA_FACTORY_ADDRESS=${factory.target}`);

  if (isRemote && process.env.ETHERSCAN_API_KEY) {
    console.log("\nWaiting for confirmations before verification...");
    await atomic.deploymentTransaction().wait(5);
    if (registryDeployed) await verify(registryAddress, []);
    await verify(impl.target, []);
    await verify(factory.target, [registryAddress, impl.target]);
    await verify(sbt.target, []);
    await verify(atomic.target, [sbt.target, factory.target]);
    console.log(`Explorer: https://sepolia.basescan.org/address/${atomic.target}`);
  } else if (isRemote) {
    console.log("\nETHERSCAN_API_KEY not set: skipped verification (npx hardhat verify --network baseSepolia <addr> <args>)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
