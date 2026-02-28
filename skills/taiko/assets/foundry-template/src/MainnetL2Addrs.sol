// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MainnetL2Addrs
/// @notice Protocol addresses on Taiko Alethia (L2, Chain ID: 167000)
/// @dev Source: https://github.com/taikoxyz/taiko-mono/blob/main/packages/protocol/contracts/layer2/mainnet/LibL2Addrs.sol
library MainnetL2Addrs {
    uint64 internal constant CHAIN_ID = 167_000;

    // ============ Core Protocol (Predefined) ============

    address internal constant BRIDGE = 0x1670000000000000000000000000000000000001;
    address internal constant ERC20_VAULT = 0x1670000000000000000000000000000000000002;
    address internal constant ERC721_VAULT = 0x1670000000000000000000000000000000000003;
    address internal constant ERC1155_VAULT = 0x1670000000000000000000000000000000000004;
    address internal constant SIGNAL_SERVICE = 0x1670000000000000000000000000000000000005;
    address internal constant SHARED_RESOLVER = 0x1670000000000000000000000000000000000006;
    address internal constant TAIKO_ANCHOR = 0x1670000000000000000000000000000000010001;
    address internal constant ROLLUP_RESOLVER = 0x1670000000000000000000000000000000010002;

    // ============ Tokens ============

    address internal constant TAIKO_TOKEN = 0xA9d23408b9bA935c230493c40C73824Df71A0975;
    address internal constant USDC = 0x07d83526730c7438048D55A4fc0b850e2aaB6f0b;
    address internal constant WETH = 0xA51894664A773981C6C112C43ce576f315d5b1B6;

    // ============ Bridged Token Implementations ============

    address internal constant BRIDGED_ERC20 = 0x98161D67f762A9E589E502348579FA38B1Ac47A8;
    address internal constant BRIDGED_ERC721 = 0x0167000000000000000000000000000000010097;
    address internal constant BRIDGED_ERC1155 = 0x0167000000000000000000000000000000010098;

    // ============ Governance ============

    address internal constant DELEGATE_CONTROLLER = 0xfA06E15B8b4c5BF3FC5d9cfD083d45c53Cbe8C7C;
    address internal constant PERMISSIONLESS_EXECUTOR = 0x4EBeC8a624ac6f01Bb6C7F13947E6Af3727319CA;

    // ============ Pacaya Resolvers ============

    address internal constant SHARED_RESOLVER_PACAYA = 0xc32277f541bBADAA260337E71Cea53871D310DC8;
    address internal constant ROLLUP_RESOLVER_PACAYA = 0x73251237d8F1B99e9966bB054722F3446195Ea56;

    // ============ Utility ============

    address internal constant MULTICALL3 = 0xcA11bde05977b3631167028862bE2a173976CA11;
    address internal constant SAFE_SINGLETON_FACTORY = 0x914d7Fec6aaC8cd542e72Bca78B30650d45643d7;
}
