# Address Verification Report

**Date:** 2026-02-23
**API Used:** Etherscan V2 API (https://api.etherscan.io/v2/api)
**API Key:** 7BKJ18BYCTWPAXRNUXGZNQIUFVPIET67HA

## Summary

- **Total Addresses Verified:** 40+
- **Verified Successfully:** 38
- **Issues Found:** 1 (Critical - incorrect L1 Bridge address in example)
- **Unable to Verify:** 4 (EOA/operator addresses - no contract code)

---

## L2 Contracts (Taiko Hoodi - Chain ID: 167013)

All L2 contracts verified successfully via Etherscan V2 API.

### Core Protocol

| Contract | Address | Status | Contract Name |
|----------|---------|--------|---------------|
| Bridge | `0x1670130000000000000000000000000000000001` | ✅ Verified | ERC1967Proxy |
| ERC20Vault | `0x1670130000000000000000000000000000000002` | ✅ Verified | ERC1967Proxy |
| ERC721Vault | `0x1670130000000000000000000000000000000003` | ✅ Verified | ERC1967Proxy |
| ERC1155Vault | `0x1670130000000000000000000000000000000004` | ✅ Verified | ERC1967Proxy |
| SignalService | `0x1670130000000000000000000000000000000005` | ✅ Verified | ERC1967Proxy |
| SharedResolver | `0x1670130000000000000000000000000000000006` | ✅ Verified | ERC1967Proxy |
| TaikoAnchor | `0x1670130000000000000000000000000000010001` | ✅ Verified | ERC1967Proxy |
| RollupResolver | `0x1670130000000000000000000000000000010002` | ✅ Verified | ERC1967Proxy |

### Tokens & Governance

| Contract | Address | Status | Contract Name |
|----------|---------|--------|---------------|
| TAIKO (Bridged) | `0x557f5b2b222F1F59F94682dF01D35Dd11f37939a` | ✅ Verified | ERC1967Proxy |
| DelegateController | `0xF7176c3aC622be8bab1B839b113230396E6877ab` | ✅ Verified | ERC1967Proxy |

### Bridged Token Implementations

| Contract | Address | Status | Contract Name |
|----------|---------|--------|---------------|
| BridgedERC20 (impl) | `0x0167013000000000000000000000000000010096` | ✅ Verified | BridgedERC20 |
| BridgedERC721 (impl) | `0x0167013000000000000000000000000000010097` | ✅ Verified | BridgedERC721 |
| BridgedERC1155 (impl) | `0x0167013000000000000000000000000000010098` | ✅ Verified | BridgedERC1155 |

### Utility Contracts

| Contract | Address | Status | Contract Name |
|----------|---------|--------|---------------|
| Multicall3 | `0xca11bde05977b3631167028862be2a173976ca11` | ✅ Verified | Multicall3 |
| Safe Singleton Factory | `0x4e59b44847b379578588920cA78FbF26c0B4956C` | ✅ Verified | (minimal factory) |

---

## L1 Contracts (Ethereum Hoodi - Chain ID: 560048)

All L1 contracts verified successfully via Etherscan V2 API.

### Core Protocol

| Contract | Address | Status | Contract Name |
|----------|---------|--------|---------------|
| Inbox (ShastaInbox) | `0xeF4bB7A442Bd68150A3aa61A6a097B86b91700BF` | ✅ Verified | ERC1967Proxy |
| Inbox (PacayaInbox) | `0xf6eA848c7d7aC83de84db45Ae28EAbf377fe0eF9` | ✅ Verified | ERC1967Proxy |
| TAIKO Token | `0xf3b83e226202ECf7E7bb2419a4C6e3eC99e963DA` | ✅ Verified | ERC1967Proxy |
| Forced Inclusion Store | `0xA7F175Aff7C62854d0A0498a0da17b66A9D452D0` | ✅ Verified | ERC1967Proxy |
| Taiko Wrapper | `0xB843132A26C13D751470a6bAf5F926EbF5d0E4b8` | ✅ Verified | ERC1967Proxy |
| SharedResolver | `0x7bbacc9FFd29442DF3173b7685560fCE96E01b62` | ✅ Verified | ERC1967Proxy |
| Rollup Address Resolver | `0x0d006d8d394dD69fAfEfF62D21Fc03E7F50eDaF4` | ✅ Verified | ERC1967Proxy |

### Preconfirmation

| Contract | Address | Status | Contract Name |
|----------|---------|--------|---------------|
| Preconf Whitelist | `0x8B969Fcf37122bC5eCB4E0e5Ad65CEEC3f1393ba` | ✅ Verified | ERC1967Proxy |
| Prover Whitelist | `0xa9a84b6667A2c60BFdE8c239918d0d9a11c77E89` | ✅ Verified | ERC1967Proxy |
| Preconf Router | `0xCD15bdEc91BbD45E56D81b4b76d4f97f5a84e555` | ✅ Verified | ERC1967Proxy |

### Bridge & Vaults

| Contract | Address | Status | Contract Name |
|----------|---------|--------|---------------|
| Bridge | `0x6a4cf607DaC2C4784B7D934Bcb3AD7F2ED18Ed80` | ✅ Verified | ERC1967Proxy |
| SignalService | `0x4c70b7F5E153D497faFa0476575903F9299ed811` | ✅ Verified | ERC1967Proxy |
| ERC20Vault | `0x0857cd029937E7a119e492434c71CB9a9Bb59aB0` | ✅ Verified | ERC1967Proxy |
| ERC721Vault | `0x4876e7993dD40C22526c8B01F2D52AD8FdbdF768` | ✅ Verified | ERC1967Proxy |
| ERC1155Vault | `0x81Ff6CcE1e5cFd6ebE83922F5A9608d1752C92c6` | ✅ Verified | ERC1967Proxy |

### Bridged Token Implementations

| Contract | Address | Status | Contract Name |
|----------|---------|--------|---------------|
| BridgedERC20 (impl) | `0xcF954A2f0346e3aD0d0119989CEdB253D8c3428B` | ✅ Verified | BridgedERC20 |
| BridgedERC721 (impl) | `0x1f81E8503bf2Fe8F44053261ad5976C255455034` | ✅ Verified | BridgedERC721 |
| BridgedERC1155 (impl) | `0xd763f72F20F62f6368D6a20bdeaE8f4A325f83c1` | ✅ Verified | BridgedERC1155 |

### Verifiers

| Contract | Address | Status | Contract Name |
|----------|---------|--------|---------------|
| Proof Verifier (Compose) | `0xd9F11261AE4B873bE0f09D0Fc41d2E3F70CD8C59` | ✅ Verified | ERC1967Proxy |
| SGX Reth Verifier | `0xd46c13B67396cD1e74Bb40e298fbABeA7DC01f11` | ✅ Verified | ERC1967Proxy |
| SGX Geth Verifier | `0xCdBB6C1751413e78a40735b6D9Aaa7D55e8c038e` | ✅ Verified | ERC1967Proxy |
| RISC0 Reth Verifier | `0xbf285Dd2FD56BF4893D207Fba4c738D1029edFfd` | ✅ Verified | ERC1967Proxy |
| SP1 Reth Verifier | `0x3B3bb4A1Cb8B1A0D65F96a5A93415375C039Eda3` | ✅ Verified | ERC1967Proxy |

### Test Tokens

| Token | Address | Status | Contract Name |
|-------|---------|--------|---------------|
| HorseToken | `0x0a5Db5597ADC81c871Ebd89e81cfa07bDc8fAfE3` | ✅ Verified | FreeMintERC20Token |
| BullToken | `0xB7A4DE1200eaA20af19e4998281117497645ecC1` | ✅ Verified | FreeMintERC20Token_With50PctgMintAndTransferFailure |

---

## Ownership & Operator Addresses

These are EOA (Externally Owned Accounts), not contracts. Verified by checking transaction activity.

| Role | Address | Status |
|------|---------|--------|
| L1 Owner | `0x1D2D1bb9D180541E88a6a682aCf3f61c1605B190` | ✅ Active (5+ txns on L1) |
| Taiko Nethermind | `0x75141CD01F50A17a915d59D245aE6B2c947D37d9` | ⚠️ EOA - No direct L2 txns |
| Taiko Chainbound | `0x205a600D515091b473b6c1A8477D967533D10749` | ⚠️ EOA - Operates on L1 |
| Taiko Gattaca | `0x445179507C3b0B84ccA739398966236a35ad8Ea1` | ⚠️ EOA - Operates on L1 |
| Taiko Prover | `0x7B399987D24FC5951f3E94A4cb16E87414bF2229` | ⚠️ EOA - Operates on L1 |

**Note:** Preconf proposers and provers operate on L1 (Ethereum Hoodi), not L2.

---

## Network Configuration Verification

### RPC Endpoint

| Endpoint | Status | Response |
|----------|--------|----------|
| `https://rpc.hoodi.taiko.xyz` | ✅ Working | Chain ID: 0x28c65 (167013) |

### Chain IDs

| Network | Expected | Actual | Status |
|---------|----------|--------|--------|
| Taiko Hoodi (L2) | 167013 | 167013 | ✅ Correct |
| Ethereum Hoodi (L1) | 560048 | 560048 | ✅ Correct |

### Current Block

- **Block Number:** ~4,689,925 (as of verification time)

---

## Issues Found

### CRITICAL: Incorrect L1 Bridge Address in CrossChainCounter.sol

**File:** `skills/hoodi/examples/solidity/CrossChainCounter.sol`

**Lines 53, 169:**
```solidity
// INCORRECT (old/deprecated address)
address public constant L1_BRIDGE = 0x99C73fAc2F015c18CE89b87b98Ee0d8bEBBB9c67;
```

**Should be:**
```solidity
// CORRECT (current L1 Bridge)
address public constant L1_BRIDGE = 0x6a4cf607DaC2C4784B7D934Bcb3AD7F2ED18Ed80;
```

**Impact:** Using the old address would cause cross-chain messages from L2 to L1 to fail.

**Verification:**
- Address `0x99C73fAc2F015c18CE89b87b98Ee0d8bEBBB9c67` exists on L1 but has no verified contract name
- Address `0x6a4cf607DaC2C4784B7D934Bcb3AD7F2ED18Ed80` is verified as ERC1967Proxy (current Bridge)
- Official source (taiko-mono) confirms `0x6a4cf607...` is the current L1 Bridge

---

## Files Reviewed

| File | Status | Notes |
|------|--------|-------|
| `skills/hoodi/references/contract-addresses.md` | ✅ Correct | All addresses verified |
| `skills/hoodi/references/network-config.md` | ✅ Correct | RPC, chain IDs verified |
| `skills/hoodi/assets/foundry-template/src/TaikoHoodiAddresses.sol` | ✅ Correct | All constants verified |
| `skills/hoodi/examples/solidity/BridgeReceiver.sol` | ✅ Correct | L2 Bridge address correct |
| `skills/hoodi/examples/solidity/CrossChainCounter.sol` | ❌ Issue | L1 Bridge address incorrect |
| `skills/hoodi/examples/python/verify_signal.py` | ✅ Correct | RPC, chain ID, addresses verified |
| `skills/hoodi/examples/python/calc_blockhash.py` | ✅ Correct | RPC endpoint verified |
| `skills/hoodi/SKILL.md` | ✅ Correct | Configuration verified |
| `agents/taiko-hoodi-developer.md` | ✅ Correct | Configuration verified |
| `.claude-plugin/plugin.json` | ✅ Correct | Metadata valid |
| `.claude-plugin/marketplace.json` | ✅ Correct | Metadata valid |

---

## Verification Method

1. **Contract Verification:** Used Etherscan V2 API with `module=contract&action=getsourcecode`
2. **Account Activity:** Used Etherscan V2 API with `module=account&action=txlist`
3. **RPC Verification:** Direct JSON-RPC calls to `https://rpc.hoodi.taiko.xyz`
4. **Source Cross-Reference:** Verified against official [taiko-mono deployment logs](https://github.com/taikoxyz/taiko-mono/blob/main/packages/protocol/deployments/taiko-hoodi-contract-logs.md)

---

## Recommendations

1. **Fix Critical Issue:** Update `CrossChainCounter.sol` to use correct L1 Bridge address
2. **Periodic Verification:** Re-verify addresses after protocol upgrades
3. **Documentation:** Consider adding verification timestamps to contract-addresses.md
