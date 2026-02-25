// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title TaikoMainnetAddresses
/// @notice Protocol addresses for Taiko Alethia (mainnet) and Ethereum Mainnet (L1)
/// @dev Source: mainnet-contract-logs-L1.md / mainnet-contract-logs-L2.md
///      Full list: see ../../references/contract-addresses.md
library TaikoMainnetAddresses {
    // ============ Taiko L2 (Chain ID: 167000) ============

    address internal constant L2_BRIDGE = 0x1670000000000000000000000000000000000001;
    address internal constant L2_ERC20_VAULT = 0x1670000000000000000000000000000000000002;
    address internal constant L2_ERC721_VAULT = 0x1670000000000000000000000000000000000003;
    address internal constant L2_ERC1155_VAULT = 0x1670000000000000000000000000000000000004;
    address internal constant L2_SIGNAL_SERVICE = 0x1670000000000000000000000000000000000005;
    address internal constant L2_SHARED_RESOLVER = 0x1670000000000000000000000000000000000006;
    address internal constant L2_TAIKO_ANCHOR = 0x1670000000000000000000000000000000010001;
    address internal constant L2_ROLLUP_RESOLVER = 0x1670000000000000000000000000000000010002;
    address internal constant L2_TAIKO_TOKEN = 0xA9d23408b9bA935c230493c40C73824Df71A0975;
    address internal constant L2_DELEGATE_CONTROLLER = 0xfA06E15B8b4c5BF3FC5d9cfD083d45c53Cbe8C7C;

    // ============ Ethereum Mainnet L1 (Chain ID: 1) ============

    address internal constant L1_INBOX = 0x06a9Ab27c7e2255df1815E6CC0168d7755Feb19a;
    address internal constant L1_FORCED_INCLUSION_STORE = 0x05d88855361808fA1d7fc28084Ef3fCa191c4e03;
    address internal constant L1_TAIKO_TOKEN = 0x10dea67478c5F8C5E2D90e5E9B26dBe60c54d800;
    address internal constant L1_BRIDGE = 0xd60247c6848B7Ca29eDdF63AA924E53dB6Ddd8EC;
    address internal constant L1_SIGNAL_SERVICE = 0x9e0a24964e5397B566c1ed39258e21aB5E35C77C;
    address internal constant L1_ERC20_VAULT = 0x996282cA11E5DEb6B5D122CC3B9A1FcAAD4415Ab;
    address internal constant L1_ERC721_VAULT = 0x0b470dd3A0e1C41228856Fb319649E7c08f419Aa;
    address internal constant L1_ERC1155_VAULT = 0xaf145913EA4a56BE22E120ED9C24589659881702;
    address internal constant L1_PRECONF_WHITELIST = 0xFD019460881e6EeC632258222393d5821029b2ac;
    address internal constant L1_SHARED_RESOLVER = 0x8Efa01564425692d0a0838DC10E300BD310Cb43e;

    // ============ Chain IDs ============

    uint64 internal constant TAIKO_MAINNET_CHAIN_ID = 167_000;
    uint64 internal constant ETHEREUM_MAINNET_CHAIN_ID = 1;
}
