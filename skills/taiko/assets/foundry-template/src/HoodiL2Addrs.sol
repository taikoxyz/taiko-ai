// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title HoodiL2Addrs
/// @notice Protocol addresses on Taiko Hoodi (L2, Chain ID: 167013)
/// @dev Source: taiko-hoodi-contract-logs.md
library HoodiL2Addrs {
    uint64 internal constant CHAIN_ID = 167_013;

    // ============ Core Protocol (Predefined) ============

    address internal constant BRIDGE = 0x1670130000000000000000000000000000000001;
    address internal constant ERC20_VAULT = 0x1670130000000000000000000000000000000002;
    address internal constant ERC721_VAULT = 0x1670130000000000000000000000000000000003;
    address internal constant ERC1155_VAULT = 0x1670130000000000000000000000000000000004;
    address internal constant SIGNAL_SERVICE = 0x1670130000000000000000000000000000000005;
    address internal constant SHARED_RESOLVER = 0x1670130000000000000000000000000000000006;
    address internal constant TAIKO_ANCHOR = 0x1670130000000000000000000000000000010001;
    address internal constant ROLLUP_RESOLVER = 0x1670130000000000000000000000000000010002;

    // ============ Tokens ============

    address internal constant TAIKO_TOKEN = 0x557f5b2b222F1F59F94682dF01D35Dd11f37939a;

    // ============ Governance ============

    address internal constant DELEGATE_CONTROLLER = 0xF7176c3aC622be8bab1B839b113230396E6877ab;

    // ============ Bridged Token Implementations ============

    address internal constant BRIDGED_ERC20 = 0x0167013000000000000000000000000000010096;
    address internal constant BRIDGED_ERC721 = 0x0167013000000000000000000000000000010097;
    address internal constant BRIDGED_ERC1155 = 0x0167013000000000000000000000000000010098;

    // ============ Utility ============

    address internal constant MULTICALL3 = 0xca11bde05977b3631167028862be2a173976ca11;
    address internal constant SAFE_SINGLETON_FACTORY = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
}
