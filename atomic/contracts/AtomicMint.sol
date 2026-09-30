// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SBT} from "./SBT.sol";
import {TBAFactory} from "./TBAFactory.sol";

/// @title AtomicMint
/// @notice Issues NFT + SBT + ERC-6551 TBA in a single transaction (all-or-nothing).
contract AtomicMint is ERC721URIStorage, Ownable, ReentrancyGuard {
    SBT public immutable sbt;
    TBAFactory public immutable tbaFactory;

    uint256 private _tokenIds;

    mapping(uint256 => address) public tbaOf; // nft tokenId => token-bound account
    mapping(uint256 => uint256) public sbtOf; // nft tokenId => sbt id

    error ZeroAddress();

    event AtomicMinted(address indexed to, uint256 indexed tokenId, uint256 sbtId, address tba, string uri);

    constructor(address sbtAddress, address tbaFactoryAddress) ERC721("OKEAtomicNFT", "OAN") Ownable(msg.sender) {
        if (sbtAddress == address(0) || tbaFactoryAddress == address(0)) revert ZeroAddress();
        sbt = SBT(sbtAddress);
        tbaFactory = TBAFactory(tbaFactoryAddress);
    }

    function totalMinted() external view returns (uint256) {
        return _tokenIds;
    }

    function atomicMint(address to, string calldata uri) external onlyOwner nonReentrant returns (uint256, address) {
        uint256 newItemId = ++_tokenIds;

        _setTokenURI(newItemId, uri);
        _safeMint(to, newItemId);

        // Same recipient gets the soulbound token. Reverts (whole tx) if cap / duplicate.
        uint256 sbtId = sbt.safeMint(to, newItemId);

        // Real ERC-6551 account bound to this NFT.
        address tba = tbaFactory.createAccount(address(this), newItemId, block.chainid);

        tbaOf[newItemId] = tba;
        sbtOf[newItemId] = sbtId;

        emit AtomicMinted(to, newItemId, sbtId, tba, uri);
        return (newItemId, tba);
    }
}
