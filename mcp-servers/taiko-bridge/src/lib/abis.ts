/**
 * Inline ABIs for Taiko bridge contracts.
 * Source: taikoxyz/taiko-mono packages/protocol/contracts/shared/bridge/IBridge.sol
 *         taikoxyz/taiko-mono packages/protocol/contracts/shared/vault/ERC20Vault.sol
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

export const IERC20VaultABI = [
  {
    name: "bridgeToken",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "_op",
        type: "tuple",
        components: [
          { name: "destChainId", type: "uint64" },
          { name: "destOwner", type: "address" },
          { name: "to", type: "address" },
          { name: "fee", type: "uint64" },
          { name: "token", type: "address" },
          { name: "gasLimit", type: "uint32" },
          { name: "amount", type: "uint256" },
        ],
      },
    ],
    outputs: [{ name: "msgHash_", type: "bytes32" }],
  },
] as const;

/** Message status codes from IBridge.Status enum (0-indexed). */
export const MESSAGE_STATUS_LABELS = ["NEW", "RETRIABLE", "DONE", "FAILED", "RECALLED"] as const;

export type MessageStatusLabel = (typeof MESSAGE_STATUS_LABELS)[number];

export function statusToLabel(code: number): MessageStatusLabel {
  return MESSAGE_STATUS_LABELS[code] ?? ("UNKNOWN" as MessageStatusLabel);
}
