# Taiko Hoodi Contract Addresses

Source: [taiko-hoodi-contract-logs.md](https://github.com/taikoxyz/taiko-mono/blob/main/packages/protocol/deployments/taiko-hoodi-contract-logs.md)

## L1 Contracts (Ethereum Hoodi - Chain ID: 560048)

### Core Protocol

| Contract | Address |
|----------|---------|
| Inbox (ShastaInbox) | `0xeF4bB7A442Bd68150A3aa61A6a097B86b91700BF` |
| Inbox (PacayaInbox) | `0xf6eA848c7d7aC83de84db45Ae28EAbf377fe0eF9` |
| TAIKO Token | `0xf3b83e226202ECf7E7bb2419a4C6e3eC99e963DA` |
| Forced Inclusion Store | `0xA7F175Aff7C62854d0A0498a0da17b66A9D452D0` |
| Taiko Wrapper | `0xB843132A26C13D751470a6bAf5F926EbF5d0E4b8` |
| SharedResolver | `0x7bbacc9FFd29442DF3173b7685560fCE96E01b62` |
| Rollup Address Resolver | `0x0d006d8d394dD69fAfEfF62D21Fc03E7F50eDaF4` |

### Preconfirmation

| Contract | Address |
|----------|---------|
| Preconf Whitelist | `0x8B969Fcf37122bC5eCB4E0e5Ad65CEEC3f1393ba` |
| Prover Whitelist | `0xa9a84b6667A2c60BFdE8c239918d0d9a11c77E89` |
| Preconf Router | `0xCD15bdEc91BbD45E56D81b4b76d4f97f5a84e555` |

### Bridge & Vaults (L1)

| Contract | Address |
|----------|---------|
| Bridge | `0x6a4cf607DaC2C4784B7D934Bcb3AD7F2ED18Ed80` |
| SignalService | `0x4c70b7F5E153D497faFa0476575903F9299ed811` |
| ERC20Vault | `0x0857cd029937E7a119e492434c71CB9a9Bb59aB0` |
| ERC721Vault | `0x4876e7993dD40C22526c8B01F2D52AD8FdbdF768` |
| ERC1155Vault | `0x81Ff6CcE1e5cFd6ebE83922F5A9608d1752C92c6` |

### Bridged Token Implementations (L1)

| Contract | Address |
|----------|---------|
| BridgedERC20 (impl) | `0xcF954A2f0346e3aD0d0119989CEdB253D8c3428B` |
| BridgedERC721 (impl) | `0x1f81E8503bf2Fe8F44053261ad5976C255455034` |
| BridgedERC1155 (impl) | `0xd763f72F20F62f6368D6a20bdeaE8f4A325f83c1` |

### Verifiers

| Contract | Address |
|----------|---------|
| Proof Verifier (Compose) | `0xd9F11261AE4B873bE0f09D0Fc41d2E3F70CD8C59` |
| SGX Reth Verifier | `0xd46c13B67396cD1e74Bb40e298fbABeA7DC01f11` |
| SGX Geth Verifier | `0xCdBB6C1751413e78a40735b6D9Aaa7D55e8c038e` |
| RISC0 Reth Verifier | `0xbf285Dd2FD56BF4893D207Fba4c738D1029edFfd` |
| SP1 Reth Verifier | `0x3B3bb4A1Cb8B1A0D65F96a5A93415375C039Eda3` |

### Test Tokens (L1)

| Token | Address |
|-------|---------|
| HorseToken | `0x0a5Db5597ADC81c871Ebd89e81cfa07bDc8fAfE3` |
| BullToken | `0xB7A4DE1200eaA20af19e4998281117497645ecC1` |

---

## L2 Contracts (Taiko Hoodi - Chain ID: 167013)

### Core Protocol (Predefined Addresses)

| Contract | Address |
|----------|---------|
| Bridge | `0x1670130000000000000000000000000000000001` |
| ERC20Vault | `0x1670130000000000000000000000000000000002` |
| ERC721Vault | `0x1670130000000000000000000000000000000003` |
| ERC1155Vault | `0x1670130000000000000000000000000000000004` |
| SignalService | `0x1670130000000000000000000000000000000005` |
| SharedResolver | `0x1670130000000000000000000000000000000006` |
| TaikoAnchor | `0x1670130000000000000000000000000000010001` |
| RollupResolver | `0x1670130000000000000000000000000000010002` |

### Bridged TAIKO Token

| Token | Address |
|-------|---------|
| TAIKO (Bridged) | `0x557f5b2b222F1F59F94682dF01D35Dd11f37939a` |

### Governance

| Contract | Address |
|----------|---------|
| DelegateController | `0xF7176c3aC622be8bab1B839b113230396E6877ab` |

### Bridged Token Implementations (L2)

| Contract | Address |
|----------|---------|
| BridgedERC20 (impl) | `0x0167013000000000000000000000000000010096` |
| BridgedERC721 (impl) | `0x0167013000000000000000000000000000010097` |
| BridgedERC1155 (impl) | `0x0167013000000000000000000000000000010098` |

### Utility Contracts

| Contract | Address |
|----------|---------|
| Multicall3 | `0xca11bde05977b3631167028862be2a173976ca11` |
| Safe Singleton Factory | `0x4e59b44847b379578588920cA78FbF26c0B4956C` |

---

## Ownership

| Role | Address |
|------|---------|
| L1 Owner | `0x1D2D1bb9D180541E88a6a682aCf3f61c1605B190` |
| L2 Owner | `0xF7176c3aC622be8bab1B839b113230396E6877ab` (DelegateController) |

## Preconf Proposers (Whitelisted)

| Operator | Address |
|----------|---------|
| Taiko Nethermind | `0x75141CD01F50A17a915d59D245aE6B2c947D37d9` |
| Taiko Chainbound | `0x205a600D515091b473b6c1A8477D967533D10749` |
| Taiko Gattaca | `0x445179507C3b0B84ccA739398966236a35ad8Ea1` |

## Whitelisted Prover

| Operator | Address |
|----------|---------|
| Taiko Prover | `0x7B399987D24FC5951f3E94A4cb16E87414bF2229` |

---

## Notes

- Addresses are proxy addresses where proxy/impl are both provided
- L2 system contracts use predefined `0x167013...` range
- For Solidity constants, see `assets/foundry-template/src/TaikoHoodiAddresses.sol`
