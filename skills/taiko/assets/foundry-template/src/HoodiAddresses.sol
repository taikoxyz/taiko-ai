// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title HoodiAddresses
/// @notice Protocol addresses for Taiko Hoodi (testnet) and Ethereum Hoodi (L1)
/// @dev Source: taiko-hoodi-contract-logs.md
library HoodiAddresses {
    // ============ Taiko Hoodi L2 (Chain ID: 167013) ============

    address internal constant L2_BRIDGE = 0x1670130000000000000000000000000000000001;
    address internal constant L2_ERC20_VAULT = 0x1670130000000000000000000000000000000002;
    address internal constant L2_ERC721_VAULT = 0x1670130000000000000000000000000000000003;
    address internal constant L2_ERC1155_VAULT = 0x1670130000000000000000000000000000000004;
    address internal constant L2_SIGNAL_SERVICE = 0x1670130000000000000000000000000000000005;
    address internal constant L2_SHARED_RESOLVER = 0x1670130000000000000000000000000000000006;
    address internal constant L2_TAIKO_ANCHOR = 0x1670130000000000000000000000000000010001;
    address internal constant L2_ROLLUP_RESOLVER = 0x1670130000000000000000000000000000010002;
    address internal constant L2_TAIKO_TOKEN = 0x557f5b2b222F1F59F94682dF01D35Dd11f37939a;
    address internal constant L2_DELEGATE_CONTROLLER = 0xF7176c3aC622be8bab1B839b113230396E6877ab;

    // ============ Ethereum Hoodi L1 (Chain ID: 560048) ============

    address internal constant L1_INBOX = 0xeF4bB7A442Bd68150A3aa61A6a097B86b91700BF;
    address internal constant L1_FORCED_INCLUSION_STORE = 0xA7F175Aff7C62854d0A0498a0da17b66A9D452D0;
    address internal constant L1_TAIKO_TOKEN = 0xf3b83e226202ECf7E7bb2419a4C6e3eC99e963DA;
    address internal constant L1_BRIDGE = 0x6a4cf607DaC2C4784B7D934Bcb3AD7F2ED18Ed80;
    address internal constant L1_SIGNAL_SERVICE = 0x4c70b7F5E153D497faFa0476575903F9299ed811;
    address internal constant L1_ERC20_VAULT = 0x0857cd029937E7a119e492434c71CB9a9Bb59aB0;
    address internal constant L1_ERC721_VAULT = 0x4876e7993dD40C22526c8B01F2D52AD8FdbdF768;
    address internal constant L1_ERC1155_VAULT = 0x81Ff6CcE1e5cFd6ebE83922F5A9608d1752C92c6;
    address internal constant L1_PRECONF_WHITELIST = 0x8B969Fcf37122bC5eCB4E0e5Ad65CEEC3f1393ba;
    address internal constant L1_SHARED_RESOLVER = 0x7bbacc9FFd29442DF3173b7685560fCE96E01b62;

    // ============ Chain IDs ============

    uint64 internal constant L2_CHAIN_ID = 167_013;
    uint64 internal constant L1_CHAIN_ID = 560_048;
}
