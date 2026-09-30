const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployAll() {
  const [deployer, issuer, alice, bob, mallory] = await ethers.getSigners();

  const registry = await (await ethers.getContractFactory("ERC6551Registry")).deploy();
  const impl = await (await ethers.getContractFactory("AWalletTBA")).deploy();
  const factory = await (await ethers.getContractFactory("TBAFactory")).deploy(registry.target, impl.target);
  const sbt = await (await ethers.getContractFactory("SBT")).deploy();
  const atomic = await (await ethers.getContractFactory("AtomicMint")).deploy(sbt.target, factory.target);
  await sbt.setMinter(atomic.target);
  await atomic.transferOwnership(issuer.address);

  return { deployer, issuer, alice, bob, mallory, registry, impl, factory, sbt, atomic };
}

describe("AtomicMint (NFT + SBT + ERC-6551 TBA)", () => {
  it("issues NFT, SBT and a real TBA atomically and records the mapping + event", async () => {
    const { issuer, alice, atomic, sbt, factory } = await deployAll();
    const uri = "ipfs://demo/1.json";

    const tx = await atomic.connect(issuer).atomicMint(alice.address, uri);
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const predicted = await factory.computeAccount(atomic.target, 1, chainId);

    await expect(tx).to.emit(atomic, "AtomicMinted").withArgs(alice.address, 1, 1, predicted, uri);
    await expect(tx).to.emit(factory, "TBACreated").withArgs(predicted, 1, chainId);

    expect(await atomic.ownerOf(1)).to.equal(alice.address);
    expect(await atomic.tokenURI(1)).to.equal(uri);
    expect(await sbt.ownerOf(1)).to.equal(alice.address);
    expect(await sbt.refIdOf(1)).to.equal(1);
    expect(await atomic.tbaOf(1)).to.equal(predicted);
    expect(await atomic.sbtOf(1)).to.equal(1);
    expect(await atomic.totalMinted()).to.equal(1);

    // TBA is a real contract, bound to the NFT, controlled by the NFT owner
    expect((await ethers.provider.getCode(predicted)).length).to.be.greaterThan(2);
    const tba = await ethers.getContractAt("AWalletTBA", predicted);
    const [cid, tokenContract, tokenId] = await tba.token();
    expect(cid).to.equal(chainId);
    expect(tokenContract).to.equal(atomic.target);
    expect(tokenId).to.equal(1);
    expect(await tba.owner()).to.equal(alice.address);
  });

  it("atomicMint keeps its (uint256,address) return value", async () => {
    const { issuer, alice, atomic } = await deployAll();
    const [id, tba] = await atomic.connect(issuer).atomicMint.staticCall(alice.address, "ipfs://x");
    expect(id).to.equal(1);
    expect(tba).to.properAddress;
  });

  it("is idempotent in the factory (existing account is returned, not redeployed)", async () => {
    const { issuer, alice, atomic, factory } = await deployAll();
    await atomic.connect(issuer).atomicMint(alice.address, "ipfs://x");
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const again = await factory.createAccount.staticCall(atomic.target, 1, chainId);
    expect(again).to.equal(await atomic.tbaOf(1));
  });

  it("rejects a foreign chainId in the factory", async () => {
    const { factory, atomic } = await deployAll();
    await expect(factory.createAccount(atomic.target, 1, 1)).to.be.revertedWithCustomError(factory, "InvalidChainId");
  });

  it("only the owner can mint", async () => {
    const { mallory, alice, atomic } = await deployAll();
    await expect(atomic.connect(mallory).atomicMint(alice.address, "x"))
      .to.be.revertedWithCustomError(atomic, "OwnableUnauthorizedAccount");
  });

  describe("SBT access control & soulbound", () => {
    it("nobody except AtomicMint can mint SBTs", async () => {
      const { mallory, sbt, issuer } = await deployAll();
      await expect(sbt.connect(mallory).safeMint(mallory.address, 1)).to.be.revertedWithCustomError(sbt, "NotMinter");
      await expect(sbt.connect(issuer).safeMint(issuer.address, 1)).to.be.revertedWithCustomError(sbt, "NotMinter");
    });

    it("minter can be set only once, only by the owner, never to zero", async () => {
      const { deployer, mallory, sbt } = await deployAll();
      await expect(sbt.connect(deployer).setMinter(mallory.address)).to.be.revertedWithCustomError(sbt, "MinterAlreadySet");
      const fresh = await (await ethers.getContractFactory("SBT")).deploy();
      await expect(fresh.connect(mallory).setMinter(mallory.address)).to.be.revertedWithCustomError(fresh, "OwnableUnauthorizedAccount");
      await expect(fresh.setMinter(ethers.ZeroAddress)).to.be.revertedWithCustomError(fresh, "ZeroAddress");
    });

    it("SBT cannot be transferred, even by its owner, and reports locked (ERC-5192)", async () => {
      const { issuer, alice, bob, atomic, sbt } = await deployAll();
      await atomic.connect(issuer).atomicMint(alice.address, "x");
      await expect(sbt.connect(alice).transferFrom(alice.address, bob.address, 1)).to.be.revertedWithCustomError(sbt, "Soulbound");
      await expect(sbt.connect(alice)["safeTransferFrom(address,address,uint256)"](alice.address, bob.address, 1))
        .to.be.revertedWithCustomError(sbt, "Soulbound");
      expect(await sbt.locked(1)).to.equal(true);
      expect(await sbt.supportsInterface("0xb45a3c0e")).to.equal(true);
      expect(await sbt.tokenURI(1)).to.equal("sbt://1");
    });

    it("demo cap: one SBT per address", async () => {
      const { issuer, alice, atomic, sbt } = await deployAll();
      await atomic.connect(issuer).atomicMint(alice.address, "a");
      await expect(atomic.connect(issuer).atomicMint(alice.address, "b")).to.be.revertedWithCustomError(sbt, "AlreadyMember");
      expect(await atomic.totalMinted()).to.equal(1); // whole tx reverted (atomic)
    });

    it("demo cap: at most 20 members, the 21st reverts atomically", async () => {
      const { issuer, atomic, sbt } = await deployAll();
      for (let i = 0; i < 20; i++) {
        await atomic.connect(issuer).atomicMint(ethers.Wallet.createRandom().address, `ipfs://${i}`);
      }
      expect(await sbt.totalMinted()).to.equal(20);
      await expect(atomic.connect(issuer).atomicMint(ethers.Wallet.createRandom().address, "ipfs://21"))
        .to.be.revertedWithCustomError(sbt, "MemberCapReached");
      expect(await atomic.totalMinted()).to.equal(20);
    });
  });

  describe("ERC-6551 account behaviour", () => {
    it("NFT owner can execute from the TBA; others cannot", async () => {
      const { issuer, alice, mallory, atomic } = await deployAll();
      await atomic.connect(issuer).atomicMint(alice.address, "x");
      const tba = await ethers.getContractAt("AWalletTBA", await atomic.tbaOf(1));

      await alice.sendTransaction({ to: tba.target, value: ethers.parseEther("1") });
      expect(await ethers.provider.getBalance(tba.target)).to.equal(ethers.parseEther("1"));

      await expect(tba.connect(mallory).execute(mallory.address, ethers.parseEther("1"), "0x", 0))
        .to.be.revertedWithCustomError(tba, "NotAuthorized");

      const before = await ethers.provider.getBalance(mallory.address);
      await tba.connect(alice).execute(mallory.address, ethers.parseEther("0.4"), "0x", 0);
      expect(await ethers.provider.getBalance(mallory.address)).to.equal(before + ethers.parseEther("0.4"));
      expect(await tba.state()).to.equal(1);

      await expect(tba.connect(alice).execute(mallory.address, 0, "0x", 1)).to.be.revertedWithCustomError(tba, "OnlyCall");
    });

    it("control follows the NFT: after transfer the new owner controls the TBA", async () => {
      const { issuer, alice, bob, atomic } = await deployAll();
      await atomic.connect(issuer).atomicMint(alice.address, "x");
      const tba = await ethers.getContractAt("AWalletTBA", await atomic.tbaOf(1));
      await atomic.connect(alice).transferFrom(alice.address, bob.address, 1);
      expect(await tba.owner()).to.equal(bob.address);
      await expect(tba.connect(alice).execute(alice.address, 0, "0x", 0)).to.be.revertedWithCustomError(tba, "NotAuthorized");
      await tba.connect(bob).execute(bob.address, 0, "0x", 0);
    });

    it("validates ERC-1271 signatures from the NFT owner and exposes ERC-165 ids", async () => {
      const { issuer, atomic } = await deployAll();
      const owner = ethers.Wallet.createRandom();
      const stranger = ethers.Wallet.createRandom();
      await atomic.connect(issuer).atomicMint(owner.address, "x");
      const tba = await ethers.getContractAt("AWalletTBA", await atomic.tbaOf(1));
      const hash = ethers.keccak256(ethers.toUtf8Bytes("hello"));
      expect(await tba.isValidSignature(hash, owner.signingKey.sign(hash).serialized)).to.equal("0x1626ba7e");
      expect(await tba.isValidSignature(hash, stranger.signingKey.sign(hash).serialized)).to.equal("0x00000000");
      expect(await tba.supportsInterface("0x6faff5f1")).to.equal(true); // IERC6551Account
      expect(await tba.supportsInterface("0x51945447")).to.equal(true); // IERC6551Executable
    });
  });
});
