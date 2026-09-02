/**
 * Inline ABIs for Taiko bridge contracts.
 * Source: taikoxyz/taiko-mono packages/protocol/contracts/shared/bridge/IBridge.sol
 *         taikoxyz/taiko-mono packages/protocol/contracts/shared/vault/ERC20Vault.sol
 *
 * Note: the permit entrypoints exist only on an ERC20Vault built with permit support. Against
 * an older deployment the selector is absent and simulation reverts — callers should fall back
 * to approve + sendToken rather than reporting a bad signature.
 */

/** IBridge.Message tuple components — used in multiple function ABIs. */
const MESSAGE_COMPONENTS = [
  { name: "id", type: "uint64" },
  { name: "fee", type: "uint64" },
  { name: "gasLimit", type: "uint32" },
  { name: "from", type: "address" },
  { name: "srcChainId", type: "uint64" },
  { name: "srcOwner", type: "address" },
  { name: "destChainId", type: "uint64" },
  { name: "destOwner", type: "address" },
  { name: "to", type: "address" },
  { name: "value", type: "uint256" },
  { name: "data", type: "bytes" },
] as const;

export const IBridgeABI = [
  {
    name: "sendMessage",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "_message", type: "tuple", components: MESSAGE_COMPONENTS }],
    outputs: [
      { name: "msgHash_", type: "bytes32" },
      { name: "message_", type: "tuple", components: MESSAGE_COMPONENTS },
    ],
  },
  {
    name: "messageStatus",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "msgHash", type: "bytes32" }],
    outputs: [{ name: "status", type: "uint8" }],
  },
  {
    name: "retryMessage",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_message", type: "tuple", components: MESSAGE_COMPONENTS },
      { name: "_isLastAttempt", type: "bool" },
    ],
    outputs: [],
  },
  {
    name: "recallMessage",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_message", type: "tuple", components: MESSAGE_COMPONENTS },
      { name: "_proof", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

/**
 * Uniswap's Permit2, deployed at the same address on every chain via the deterministic
 * deployer, so it needs no per-network configuration.
 */
export const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as const;

/** ERC20Vault.BridgeTransferOp tuple components — shared by all three send entrypoints. */
const BRIDGE_TRANSFER_OP_COMPONENTS = [
  { name: "destChainId", type: "uint64" },
  { name: "destOwner", type: "address" },
  { name: "to", type: "address" },
  { name: "fee", type: "uint64" },
  { name: "token", type: "address" },
  { name: "gasLimit", type: "uint32" },
  { name: "amount", type: "uint256" },
] as const;

const BRIDGE_TRANSFER_OP_INPUT = {
  name: "_op",
  type: "tuple",
  components: BRIDGE_TRANSFER_OP_COMPONENTS,
} as const;

/** All three entrypoints return the constructed IBridge.Message. */
const MESSAGE_OUTPUT = [{ name: "message_", type: "tuple", components: MESSAGE_COMPONENTS }] as const;

export const IERC20VaultABI = [
  {
    name: "sendToken",
    type: "function",
    stateMutability: "payable",
    inputs: [BRIDGE_TRANSFER_OP_INPUT],
    outputs: MESSAGE_OUTPUT,
  },
  {
    // EIP-2612: sets this vault's allowance from the caller's signature, no approve tx.
    // Only works for tokens implementing EIP-2612; the caller must be the signer.
    name: "sendTokenWithPermit",
    type: "function",
    stateMutability: "payable",
    inputs: [
      BRIDGE_TRANSFER_OP_INPUT,
      { name: "_deadline", type: "uint256" },
      { name: "_v", type: "uint8" },
      { name: "_r", type: "bytes32" },
      { name: "_s", type: "bytes32" },
    ],
    outputs: MESSAGE_OUTPUT,
  },
  {
    // Permit2 SignatureTransfer: works for any ERC20, requires a one-time
    // token.approve(PERMIT2, ...). The caller must be the signer. Signature stays raw bytes
    // so a smart-contract wallet can authorize with EIP-1271.
    name: "sendTokenWithPermit2",
    type: "function",
    stateMutability: "payable",
    inputs: [
      BRIDGE_TRANSFER_OP_INPUT,
      { name: "_nonce", type: "uint256" },
      { name: "_deadline", type: "uint256" },
      { name: "_signature", type: "bytes" },
    ],
    outputs: MESSAGE_OUTPUT,
  },
] as const;

/** Message status codes from IBridge.Status enum (0-indexed). */
export const MESSAGE_STATUS_LABELS = ["NEW", "RETRIABLE", "DONE", "FAILED", "RECALLED"] as const;

export type MessageStatusLabel = (typeof MESSAGE_STATUS_LABELS)[number];

export function statusToLabel(code: number): MessageStatusLabel {
  return MESSAGE_STATUS_LABELS[code] ?? ("UNKNOWN" as MessageStatusLabel);
}
