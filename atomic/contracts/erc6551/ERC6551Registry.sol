// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC6551Registry} from "./IERC6551.sol";

/// @notice Reference-compatible ERC-6551 registry (ERC-1167 proxy + 128 byte footer).
/// @dev Only deployed by scripts/tests when the canonical registry
///      (0x000000006551c19487814612e58FE06813775758) has no code on the target chain.
contract ERC6551Registry is IERC6551Registry {
    function createAccount(
        address implementation,
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) external returns (address) {
        bytes memory code = _creationCode(implementation, salt, chainId, tokenContract, tokenId);
        address _account = _computeAddress(salt, code);

        if (_account.code.length != 0) return _account;

        emit ERC6551AccountCreated(_account, implementation, salt, chainId, tokenContract, tokenId);

        assembly {
            _account := create2(0, add(code, 0x20), mload(code), salt)
        }
        if (_account == address(0)) revert AccountCreationFailed();

        return _account;
    }

    function account(
        address implementation,
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) external view returns (address) {
        bytes memory code = _creationCode(implementation, salt, chainId, tokenContract, tokenId);
        return _computeAddress(salt, code);
    }

    function _computeAddress(bytes32 salt, bytes memory code) private view returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(bytes1(0xff), address(this), salt, keccak256(code))))));
    }

    function _creationCode(
        address implementation_,
        bytes32 salt_,
        uint256 chainId_,
        address tokenContract_,
        uint256 tokenId_
    ) private pure returns (bytes memory) {
        return abi.encodePacked(
            hex"3d60ad80600a3d3981f3363d3d373d3d3d363d73",
            implementation_,
            hex"5af43d82803e903d91602b57fd5bf3",
            abi.encode(salt_, chainId_, tokenContract_, tokenId_)
        );
    }
}
