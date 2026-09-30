// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC6551Registry} from "./erc6551/IERC6551.sol";

/// @title TBAFactory
/// @notice Creates real ERC-6551 token-bound accounts through an ERC-6551 Registry
///         (deterministic CREATE2 deployment of an ERC-1167 proxy to `implementation`).
/// @dev `createAccount` keeps the original (tokenContract, tokenId, chainId) signature and the
///      original `TBACreated` event. It is idempotent: an existing account is returned as-is.
contract TBAFactory {
    IERC6551Registry public immutable registry;
    address public immutable implementation;
    bytes32 public constant SALT = bytes32(0);

    error ZeroAddress();
    error InvalidChainId();

    event TBACreated(address indexed tba, uint256 tokenId, uint256 chainId);

    constructor(address registry_, address implementation_) {
        if (registry_ == address(0) || implementation_ == address(0)) revert ZeroAddress();
        registry = IERC6551Registry(registry_);
        implementation = implementation_;
    }

    function createAccount(address tokenContract, uint256 tokenId, uint256 chainId) public returns (address tba) {
        if (chainId != block.chainid) revert InvalidChainId();
        tba = registry.createAccount(implementation, SALT, chainId, tokenContract, tokenId);
        emit TBACreated(tba, tokenId, chainId);
    }

    function computeAccount(address tokenContract, uint256 tokenId, uint256 chainId) external view returns (address) {
        return registry.account(implementation, SALT, chainId, tokenContract, tokenId);
    }
}
