import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ethers } from "ethers";
import { z } from "zod";
import { TaikoscanClient } from "@taikoxyz/taiko-api-client";
import { getProvider } from "../lib/rpc.js";

const networkParam = z
  .enum(["mainnet", "hoodi"])
  .default("mainnet")
  .describe("Taiko network: mainnet (chain 167000) or hoodi testnet (chain 167013)");

export function registerBaseTools(server: McpServer, taikoscan: TaikoscanClient): void {
  // get_balance
  server.tool(
    "get_balance",
    "Get the ETH balance of an address on Taiko",
    {
      address: z.string().describe("Ethereum address (0x...)"),
      network: networkParam,
    },
    async ({ address, network }) => {
      const balanceWei = await taikoscan.getBalance(address, network);
      const balanceEth = ethers.formatEther(balanceWei);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ address, network, balanceWei, balanceEth }),
          },
        ],
      };
    }
  );

  // get_transactions
  server.tool(
    "get_transactions",
    "Get transaction history for an address on Taiko",
    {
      address: z.string().describe("Ethereum address"),
      network: networkParam,
      page: z.number().int().min(1).default(1).describe("Page number"),
      limit: z.number().int().min(1).max(100).default(25).describe("Transactions per page"),
    },
    async ({ address, network, page, limit }) => {
      const txs = await taikoscan.getTransactions(address, network, page, limit);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ address, network, page, count: txs.length, transactions: txs }),
          },
        ],
      };
    }
  );

  // get_block_info
  server.tool(
    "get_block_info",
    "Get block information by number or 'latest' on Taiko",
    {
      block_number: z.string().default("latest").describe("Block number as decimal string, or 'latest'"),
      network: networkParam,
    },
    async ({ block_number, network }) => {
      const provider = getProvider(network);
      const tag = block_number === "latest" ? "latest" : BigInt(block_number);
      const block = await provider.getBlock(tag);
      if (!block) {
        return { content: [{ type: "text", text: `Block not found: ${block_number}` }] };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              network,
              number: block.number,
              hash: block.hash,
              timestamp: block.timestamp,
              parentHash: block.parentHash,
              gasLimit: block.gasLimit?.toString(),
              gasUsed: block.gasUsed?.toString(),
              baseFeePerGas: block.baseFeePerGas?.toString(),
              transactionCount: block.transactions.length,
            }),
          },
        ],
      };
    }
  );

  // get_transaction_info
  server.tool(
    "get_transaction_info",
    "Get full transaction details and receipt by hash on Taiko",
    {
      hash: z.string().describe("Transaction hash (0x...)"),
      network: networkParam,
    },
    async ({ hash, network }) => {
      const provider = getProvider(network);
      const [tx, receipt] = await Promise.all([provider.getTransaction(hash), provider.getTransactionReceipt(hash)]);
      if (!tx) {
        return { content: [{ type: "text", text: `Transaction not found: ${hash}` }] };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              network,
              hash,
              from: tx.from,
              to: tx.to,
              value: tx.value.toString(),
              valueEth: ethers.formatEther(tx.value),
              gasPrice: tx.gasPrice?.toString(),
              gasLimit: tx.gasLimit?.toString(),
              nonce: tx.nonce,
              blockNumber: tx.blockNumber,
              status: receipt?.status === 1 ? "success" : receipt?.status === 0 ? "reverted" : "pending",
              gasUsed: receipt?.gasUsed?.toString(),
              input: tx.data,
            }),
          },
        ],
      };
    }
  );

  // get_contract_abi
  server.tool(
    "get_contract_abi",
    "Fetch the verified ABI for a contract on Taiko from Taikoscan",
    {
      address: z.string().describe("Contract address"),
      network: networkParam,
    },
    async ({ address, network }) => {
      const abiStr = await taikoscan.getContractABI(address, network);
      let abi: unknown;
      try {
        abi = JSON.parse(abiStr);
      } catch {
        abi = abiStr;
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ address, network, abi }),
          },
        ],
      };
    }
  );

  // read_contract
  server.tool(
    "read_contract",
    "Call a read-only (view/pure) function on a contract on Taiko",
    {
      address: z.string().describe("Contract address"),
      function_name: z.string().describe("Function name to call"),
      args: z.array(z.string()).default([]).describe("Function arguments as strings"),
      abi: z.string().optional().describe("JSON ABI string (optional — fetched from Taikoscan if omitted)"),
      network: networkParam,
    },
    async ({ address, function_name, args, abi: abiParam, network }) => {
      const provider = getProvider(network);
      let abiStr = abiParam;
      if (!abiStr) {
        abiStr = await taikoscan.getContractABI(address, network);
      }
      const contract = new ethers.Contract(address, JSON.parse(abiStr), provider);
      const result = await contract[function_name](...args);
      const resultStr =
        typeof result === "bigint"
          ? result.toString()
          : JSON.stringify(result, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ address, network, function: function_name, args, result: resultStr }),
          },
        ],
      };
    }
  );

  // get_token_transfers
  server.tool(
    "get_token_transfers",
    "Get ERC-20 token transfer history for an address on Taiko",
    {
      address: z.string().describe("Ethereum address"),
      token: z.string().optional().describe("Filter by specific ERC-20 token contract address (optional)"),
      network: networkParam,
    },
    async ({ address, token, network }) => {
      const transfers = await taikoscan.getTokenTransfers(address, network, token);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ address, network, count: transfers.length, transfers }),
          },
        ],
      };
    }
  );

  // get_gas_price
  server.tool(
    "get_gas_price",
    "Get current gas price information on Taiko (safe, propose, fast)",
    {
      network: networkParam,
    },
    async ({ network }) => {
      const [oracle, provider] = await Promise.all([
        taikoscan.getGasOracle(network).catch(() => null),
        getProvider(network),
      ]);
      const feeData = await provider.getFeeData();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              network,
              gasPrice: feeData.gasPrice?.toString(),
              gasPriceGwei: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") : null,
              maxFeePerGas: feeData.maxFeePerGas?.toString(),
              maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
              oracle: oracle ?? "unavailable",
            }),
          },
        ],
      };
    }
  );

  // get_block_number
  server.tool(
    "get_block_number",
    "Get the latest block number on Taiko",
    {
      network: networkParam,
    },
    async ({ network }) => {
      const provider = getProvider(network);
      const blockNumber = await provider.getBlockNumber();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ network, blockNumber }),
          },
        ],
      };
    }
  );

  // get_transaction_count
  server.tool(
    "get_transaction_count",
    "Get the transaction count (nonce) for an address on Taiko",
    {
      address: z.string().describe("Ethereum address"),
      network: networkParam,
    },
    async ({ address, network }) => {
      const provider = getProvider(network);
      const count = await provider.getTransactionCount(address);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ address, network, transactionCount: count }),
          },
        ],
      };
    }
  );

  // get_logs
  server.tool(
    "get_logs",
    "Get event logs from a contract on Taiko",
    {
      address: z.string().describe("Contract address"),
      event_signature: z.string().optional().describe("Event signature like 'Transfer(address,address,uint256)'"),
      from_block: z.number().int().nonnegative().optional().describe("Start block number"),
      to_block: z.number().int().nonnegative().optional().describe("End block number (default: latest)"),
      network: networkParam,
    },
    async ({ address, event_signature, from_block, to_block, network }) => {
      const provider = getProvider(network);

      // Cap block range to prevent RPC timeout / OOM (most providers cap at 2k-10k blocks)
      const MAX_BLOCK_RANGE = 10_000;
      const latestBlock = to_block ?? (await provider.getBlockNumber());
      const startBlock = from_block ?? latestBlock;
      const range = latestBlock - startBlock;

      if (range < 0) {
        throw new Error(`Invalid block range: from_block (${startBlock}) is greater than to_block (${latestBlock}).`);
      }

      if (range > MAX_BLOCK_RANGE) {
        throw new Error(
          `Block range ${range} exceeds maximum of ${MAX_BLOCK_RANGE}. ` +
            `Use a narrower range or paginate with multiple calls.`
        );
      }

      const filter: ethers.Filter = {
        address,
        fromBlock: startBlock,
        toBlock: latestBlock,
      };
      if (event_signature) {
        filter.topics = [ethers.id(event_signature)];
      }
      const logs = await provider.getLogs(filter);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ address, network, count: logs.length, logs }),
          },
        ],
      };
    }
  );
}
