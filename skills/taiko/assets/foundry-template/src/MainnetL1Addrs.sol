// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MainnetL1Addrs
/// @notice Protocol addresses on Ethereum Mainnet (L1) for Taiko Alethia
/// @dev Source: https://github.com/taikoxyz/taiko-mono/blob/main/packages/protocol/contracts/layer1/mainnet/LibL1Addrs.sol
library MainnetL1Addrs {
    uint64 internal constant CHAIN_ID = 1;

    // ============ DAO & Governance ============

    address internal constant DAO = 0x9CDf589C941ee81D75F34d3755671d614f7cf261;
    address internal constant DAO_SIGNER_LIST = 0x0F95E6968EC1B28c794CF1aD99609431de5179c2;
    address internal constant DAO_STANDARD_MULTISIG = 0xD7dA1C25E915438720692bC55eb3a7170cA90321;
    address internal constant DAO_EMERGENCY_MULTISIG = 0x2AffADEb2ef5e1F2a7F58964ee191F1e88317ECd;
    address internal constant DAO_CONTROLLER = 0x75Ba76403b13b26AD1beC70D6eE937314eeaCD0a;
    address internal constant DAO_OPTIMISTIC_TOKEN_VOTING_PLUGIN = 0x989E348275b659d36f8751ea1c10D146211650BE;
    address internal constant MULTISIG_ADMIN_TAIKO_ETH = 0x9CBeE534B5D8a6280e01a14844Ee8aF350399C7F;

    // ============ Core Protocol ============

    address internal constant INBOX = 0x06a9Ab27c7e2255df1815E6CC0168d7755Feb19a;
    address internal constant FORCED_INCLUSION_STORE = 0x05d88855361808fA1d7fc28084Ef3fCa191c4e03;
    address internal constant TAIKO_TOKEN = 0x10dea67478c5F8C5E2D90e5E9B26dBe60c54d800;
    address internal constant TAIKO_WRAPPER = 0x9F9D2fC7abe74C79f86F0D1212107692430eef72;
    address internal constant SHARED_RESOLVER = 0x8Efa01564425692d0a0838DC10E300BD310Cb43e;
    address internal constant ROLLUP_ADDRESS_RESOLVER = 0x5A982Fb1818c22744f5d7D36D0C4c9f61937b33a;

    // ============ Preconfirmation ============

    address internal constant PRECONF_WHITELIST = 0xFD019460881e6EeC632258222393d5821029b2ac;
    address internal constant PRECONF_ROUTER = 0xD5AA0e20e8A6e9b04F080Cf8797410fafAa9688a;

    // ============ Bridge & Vaults ============

    address internal constant BRIDGE = 0xd60247c6848B7Ca29eDdF63AA924E53dB6Ddd8EC;
    address internal constant SIGNAL_SERVICE = 0x9e0a24964e5397B566c1ed39258e21aB5E35C77C;
    address internal constant ERC20_VAULT = 0x996282cA11E5DEb6B5D122CC3B9A1FcAAD4415Ab;
    address internal constant ERC721_VAULT = 0x0b470dd3A0e1C41228856Fb319649E7c08f419Aa;
    address internal constant ERC1155_VAULT = 0xaf145913EA4a56BE22E120ED9C24589659881702;

    // ============ Bridged Token Implementations ============

    address internal constant BRIDGED_ERC20 = 0x65666141a541423606365123Ed280AB16a09A2e1;
    address internal constant BRIDGED_ERC721 = 0xC3310905E2BC9Cfb198695B75EF3e5B69C6A1Bf7;
    address internal constant BRIDGED_ERC1155 = 0x3c90963cFBa436400B0F9C46Aa9224cB379c2c40;

    // ============ Verifiers ============

    address internal constant PROOF_VERIFIER = 0xB16931e78d0cE3c9298bbEEf3b5e2276D34b8da1;
    address internal constant SGX_RETH = 0x9e322fC59b8f4A29e6b25c3a166ac1892AA30136;
    address internal constant SGX_GETH = 0x7e6409e9b6c5e2064064a6cC994f9a2e95680782;
    address internal constant RISC0_RETH = 0x73Ee496dA20e5C65340c040B0D8c3C891C1f74AE;
    address internal constant SP1_RETH = 0xbee1040D0Aab17AE19454384904525aE4A3602B9;

    // ============ Notable External Contracts ============

    address internal constant ENS_REVERSE_REGISTRAR = 0xa58E81fe9b61B5c3fE2AFD33CF304c454AbFc7Cb;
    address internal constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address internal constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address internal constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
}
