// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title HoodiL1Addrs
/// @notice Protocol addresses on Ethereum Hoodi (L1) for Taiko Hoodi testnet
/// @dev Source: taiko-hoodi-contract-logs.md
library HoodiL1Addrs {
    uint64 internal constant CHAIN_ID = 560_048;

    // ============ Core Protocol ============

    address internal constant INBOX = 0xeF4bB7A442Bd68150A3aa61A6a097B86b91700BF;
    address internal constant PACAYA_INBOX = 0xf6eA848c7d7aC83de84db45Ae28EAbf377fe0eF9;
    address internal constant FORCED_INCLUSION_STORE = 0xA7F175Aff7C62854d0A0498a0da17b66A9D452D0;
    address internal constant TAIKO_TOKEN = 0xf3b83e226202ECf7E7bb2419a4C6e3eC99e963DA;
    address internal constant TAIKO_WRAPPER = 0xB843132A26C13D751470a6bAf5F926EbF5d0E4b8;
    address internal constant SHARED_RESOLVER = 0x7bbacc9FFd29442DF3173b7685560fCE96E01b62;
    address internal constant ROLLUP_ADDRESS_RESOLVER = 0x0d006d8d394dD69fAfEfF62D21Fc03E7F50eDaF4;

    // ============ Preconfirmation ============

    address internal constant PRECONF_WHITELIST = 0x8B969Fcf37122bC5eCB4E0e5Ad65CEEC3f1393ba;
    address internal constant PROVER_WHITELIST = 0xa9a84b6667A2c60BFdE8c239918d0d9a11c77E89;
    address internal constant PRECONF_ROUTER = 0xCD15bdEc91BbD45E56D81b4b76d4f97f5a84e555;

    // ============ Bridge & Vaults ============

    address internal constant BRIDGE = 0x6a4cf607DaC2C4784B7D934Bcb3AD7F2ED18Ed80;
    address internal constant SIGNAL_SERVICE = 0x4c70b7F5E153D497faFa0476575903F9299ed811;
    address internal constant ERC20_VAULT = 0x0857cd029937E7a119e492434c71CB9a9Bb59aB0;
    address internal constant ERC721_VAULT = 0x4876e7993dD40C22526c8B01F2D52AD8FdbdF768;
    address internal constant ERC1155_VAULT = 0x81Ff6CcE1e5cFd6ebE83922F5A9608d1752C92c6;

    // ============ Bridged Token Implementations ============

    address internal constant BRIDGED_ERC20 = 0xcF954A2f0346e3aD0d0119989CEdB253D8c3428B;
    address internal constant BRIDGED_ERC721 = 0x1f81E8503bf2Fe8F44053261ad5976C255455034;
    address internal constant BRIDGED_ERC1155 = 0xd763f72F20F62f6368D6a20bdeaE8f4A325f83c1;

    // ============ Verifiers ============

    address internal constant PROOF_VERIFIER = 0xd9F11261AE4B873bE0f09D0Fc41d2E3F70CD8C59;
    address internal constant SGX_RETH = 0xd46c13B67396cD1e74Bb40e298fbABeA7DC01f11;
    address internal constant SGX_GETH = 0xCdBB6C1751413e78a40735b6D9Aaa7D55e8c038e;
    address internal constant RISC0_RETH = 0xbf285Dd2FD56BF4893D207Fba4c738D1029edFfd;
    address internal constant SP1_RETH = 0x3B3bb4A1Cb8B1A0D65F96a5A93415375C039Eda3;

    // ============ Test Tokens ============

    address internal constant HORSE_TOKEN = 0x0a5Db5597ADC81c871Ebd89e81cfa07bDc8fAfE3;
    address internal constant BULL_TOKEN = 0xB7A4DE1200eaA20af19e4998281117497645ecC1;

    // ============ Preconf Proposers (Whitelisted) ============

    address internal constant PROPOSER_NETHERMIND = 0x75141CD01F50A17a915d59D245aE6B2c947D37d9;
    address internal constant PROPOSER_CHAINBOUND = 0x205a600D515091b473b6c1A8477D967533D10749;
    address internal constant PROPOSER_GATTACA = 0x445179507C3b0B84ccA739398966236a35ad8Ea1;

    // ============ Whitelisted Prover ============

    address internal constant PROVER = 0x7B399987D24FC5951f3E94A4cb16E87414bF2229;
}
