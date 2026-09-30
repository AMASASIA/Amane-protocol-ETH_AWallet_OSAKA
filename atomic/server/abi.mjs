import { parseAbi } from "viem";

// Must stay in sync with contracts/AtomicMint.sol (checked by server/test/abi.test.mjs).
export const atomicMintAbi = parseAbi([
  "function atomicMint(address to, string uri) returns (uint256, address)",
  "function tbaOf(uint256 tokenId) view returns (address)",
  "function sbtOf(uint256 tokenId) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function totalMinted() view returns (uint256)",
  "event AtomicMinted(address indexed to, uint256 indexed tokenId, uint256 sbtId, address tba, string uri)",
]);
