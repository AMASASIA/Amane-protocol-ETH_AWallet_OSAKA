// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @dev ERC-5192 minimal soulbound interface.
interface IERC5192 {
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);

    function locked(uint256 tokenId) external view returns (bool);
}

/// @title SBT
/// @notice Non-transferable token. Demo spec: only the configured minter (AtomicMint) can mint,
///         at most MAX_MEMBERS (20) tokens in total and one per address.
contract SBT is ERC721, Ownable, IERC5192 {
    uint256 public constant MAX_MEMBERS = 20;

    address public minter;
    uint256 public totalMinted;
    mapping(address => bool) public isMember;
    mapping(uint256 => uint256) public refIdOf; // sbtId => AtomicMint tokenId

    error NotMinter();
    error MinterAlreadySet();
    error ZeroAddress();
    error MemberCapReached();
    error AlreadyMember(address account);
    error Soulbound();

    event MinterSet(address indexed minter);

    constructor() ERC721("SoulBoundToken", "SBT") Ownable(msg.sender) {}

    /// @notice One-time wiring of the only address allowed to mint (AtomicMint).
    function setMinter(address newMinter) external onlyOwner {
        if (minter != address(0)) revert MinterAlreadySet();
        if (newMinter == address(0)) revert ZeroAddress();
        minter = newMinter;
        emit MinterSet(newMinter);
    }

    function safeMint(address to, uint256 refId) external returns (uint256 newId) {
        if (msg.sender != minter) revert NotMinter();
        if (totalMinted >= MAX_MEMBERS) revert MemberCapReached();
        if (isMember[to]) revert AlreadyMember(to);

        newId = ++totalMinted;
        isMember[to] = true;
        refIdOf[newId] = refId;

        _safeMint(to, newId);
        emit Locked(newId);
    }

    function locked(uint256 tokenId) external view returns (bool) {
        _requireOwned(tokenId);
        return true;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string.concat("sbt://", Strings.toString(refIdOf[tokenId]));
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == type(IERC5192).interfaceId || super.supportsInterface(interfaceId);
    }

    /// @dev Blocks every movement of an existing token (transfer and burn). Minting is allowed.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        if (_ownerOf(tokenId) != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }
}
