# Taiko Mainnet Contract Addresses

Source: [mainnet-contract-logs-L1.md](https://github.com/taikoxyz/taiko-mono/blob/main/packages/protocol/deployments/mainnet-contract-logs-L1.md) and [mainnet-contract-logs-L2.md](https://github.com/taikoxyz/taiko-mono/blob/main/packages/protocol/deployments/mainnet-contract-logs-L2.md)

## L1 Contracts (Ethereum Mainnet - Chain ID: 1)

### Core Protocol

| Contract | Address |
|----------|---------|
| Inbox (TaikoInbox) | `0x06a9Ab27c7e2255df1815E6CC0168d7755Feb19a` |
| TAIKO Token | `0x10dea67478c5F8C5E2D90e5E9B26dBe60c54d800` |
| Forced Inclusion Store | `0x05d88855361808fA1d7fc28084Ef3fCa191c4e03` |
| Taiko Wrapper | `0x9F9D2fC7abe74C79f86F0D1212107692430eef72` |
| SharedResolver | `0x8Efa01564425692d0a0838DC10E300BD310Cb43e` |
| Rollup Address Resolver | `0x5A982Fb1818c22744f5d7D36D0C4c9f61937b33a` |

### Preconfirmation

| Contract | Address |
|----------|---------|
| Preconf Whitelist | `0xFD019460881e6EeC632258222393d5821029b2ac` |
| Preconf Router | `0xD5AA0e20e8A6e9b04F080Cf8797410fafAa9688a` |

### Bridge & Vaults (L1)

| Contract | Address |
|----------|---------|
| Bridge | `0xd60247c6848B7Ca29eDdF63AA924E53dB6Ddd8EC` |
| SignalService | `0x9e0a24964e5397B566c1ed39258e21aB5E35C77C` |
| ERC20Vault | `0x996282cA11E5DEb6B5D122CC3B9A1FcAAD4415Ab` |
| ERC721Vault | `0x0b470dd3A0e1C41228856Fb319649E7c08f419Aa` |
| ERC1155Vault | `0xaf145913EA4a56BE22E120ED9C24589659881702` |
| QuotaManager | `0x91f67118DD47d502B1f0C354D0611997B022f29E` |

### Bridged Token Implementations (L1)

| Contract | Address |
|----------|---------|
| BridgedERC20 (impl) | `0x65666141a541423606365123Ed280AB16a09A2e1` |
| BridgedERC721 (impl) | `0xC3310905E2BC9Cfb198695B75EF3e5B69C6A1Bf7` |
| BridgedERC1155 (impl) | `0x3c90963cFBa436400B0F9C46Aa9224cB379c2c40` |

### Verifiers

| Contract | Address |
|----------|---------|
| Proof Verifier (Compose) | `0xB16931e78d0cE3c9298bbEEf3b5e2276D34b8da1` |
| SGX Reth Verifier | `0x9e322fC59b8f4A29e6b25c3a166ac1892AA30136` |
| SGX Geth Verifier | `0x7e6409e9b6c5e2064064a6cC994f9a2e95680782` |
| RISC0 Reth Verifier | `0x73Ee496dA20e5C65340c040B0D8c3C891C1f74AE` |
| SP1 Reth Verifier | `0xbee1040D0Aab17AE19454384904525aE4A3602B9` |

### Notable External Tokens (L1)

| Token | Address |
|-------|---------|
| WETH | `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2` |
| USDT | `0xdAC17F958D2ee523a2206206994597C13D831ec7` |
| USDC | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |

---

## L2 Contracts (Taiko Alethia - Chain ID: 167000)

### Core Protocol (Predefined Addresses)

| Contract | Address |
|----------|---------|
| Bridge | `0x1670000000000000000000000000000000000001` |
| ERC20Vault | `0x1670000000000000000000000000000000000002` |
| ERC721Vault | `0x1670000000000000000000000000000000000003` |
| ERC1155Vault | `0x1670000000000000000000000000000000000004` |
| SignalService | `0x1670000000000000000000000000000000000005` |
| SharedResolver | `0x1670000000000000000000000000000000000006` |
| TaikoAnchor | `0x1670000000000000000000000000000000010001` |
| RollupResolver | `0x1670000000000000000000000000000000010002` |

### Bridged TAIKO Token

| Token | Address |
|-------|---------|
| TAIKO (Bridged) | `0xA9d23408b9bA935c230493c40C73824Df71A0975` |

### Other Bridged Tokens

| Token | Address |
|-------|---------|
| USDC (Native) | `0x07d83526730c7438048D55A4fc0b850e2aaB6f0b` |
| WETH | `0xA51894664A773981C6C112C43ce576f315d5b1B6` |

### Governance

| Contract | Address |
|----------|---------|
| DelegateController | `0xfA06E15B8b4c5BF3FC5d9cfD083d45c53Cbe8C7C` |

### Pacaya Resolvers (L2)

| Contract | Address |
|----------|---------|
| SharedResolver (Pacaya) | `0xc32277f541bBADAA260337E71Cea53871D310DC8` |
| RollupResolver (Pacaya) | `0x73251237d8F1B99e9966bB054722F3446195Ea56` |

### Bridged Token Implementations (L2)

| Contract | Address |
|----------|---------|
| BridgedERC20 (impl) | `0x98161D67f762A9E589E502348579FA38B1Ac47A8` |
| BridgedERC721 (impl) | `0x0167000000000000000000000000000000010097` |
| BridgedERC1155 (impl) | `0x0167000000000000000000000000000000010098` |

### Utility Contracts

| Contract | Address |
|----------|---------|
| Multicall3 | `0xca11bde05977b3631167028862be2a173976ca11` |
| Safe Singleton Factory | `0x914d7Fec6aaC8cd542e72Bca78B30650d45643d7` |

---

## Ownership

| Role | Address |
|------|---------|
| L1 Owner (Taiko DAO) | `0x9CDf589C941ee81D75F34d3755671d614f7cf261` |
| L2 Owner (DelegateController) | `0xfA06E15B8b4c5BF3FC5d9cfD083d45c53Cbe8C7C` |
| L2 Admin | `0xCa5b76Cc7A38b86Db11E5aE5B1fc9740c3bA3DE8` |

---

## Notes

- Addresses are proxy addresses where proxy/impl are both provided
- L2 system contracts use predefined `0x167000...` range
- For Solidity constants, see `assets/foundry-template/src/TaikoMainnetAddresses.sol`
- Mainnet is governed by the Taiko DAO on L1
