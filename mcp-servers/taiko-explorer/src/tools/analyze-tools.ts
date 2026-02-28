import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execFile } from "child_process";
import { promisify } from "util";
import { mkdtemp, writeFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { TaikoscanClient } from "@taikoxyz/taiko-api-client";
import { type Network } from "@taikoxyz/taiko-api-client";

const execFileAsync = promisify(execFile);

const networkParam = z
  .enum(["mainnet", "hoodi"])
  .default("mainnet")
  .describe("Taiko network: mainnet (chain 167000) or hoodi testnet (chain 167013)");

/**
 * Check if Slither is available in PATH.
 */
async function isSlitherAvailable(): Promise<boolean> {
  const slitherPath = process.env.SLITHER_PATH ?? "slither";
  try {
    await execFileAsync(slitherPath, ["--version"], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Run Slither on a Solidity source file.
 * Returns parsed JSON output.
 */
async function runSlither(
  sourceCode: string,
  tmpDir: string
): Promise<{ detectors: Array<{ check: string; impact: string; confidence: string; description: string }> }> {
  const slitherPath = process.env.SLITHER_PATH ?? "slither";
  const srcFile = join(tmpDir, "contract.sol");
  await writeFile(srcFile, sourceCode, "utf-8");

  const { stdout } = await execFileAsync(
    slitherPath,
    [srcFile, "--json", "-"],
    { timeout: 120_000 } // 2 minute timeout
  );

  const result = JSON.parse(stdout) as {
    results?: {
      detectors?: Array<{
        check: string;
        impact: string;
        confidence: string;
        description: string;
      }>;
    };
  };

  return { detectors: result.results?.detectors ?? [] };
}

export function registerAnalyzeTools(server: McpServer): void {
  // ─── analyze_contract ──────────────────────────────────────────────────────
  server.tool(
    "analyze_contract",
    "Run static security analysis (Slither) on a verified contract. " +
      "Fetches the source code from Taikoscan, then runs Slither locally to detect 80+ vulnerability types. " +
      "REQUIRES: Slither installed locally (`pip install slither-analyzer`) and set in SLITHER_PATH. " +
      "For hosted analysis without local Slither, deploy this server on Railway or Fly.io with Slither pre-installed.",
    {
      address: z.string().describe("Contract address (0x-prefixed) — must be verified on Taikoscan"),
      network: networkParam,
    },
    async ({ address, network }) => {
      // Check Slither availability upfront
      const slitherAvailable = await isSlitherAvailable();
      if (!slitherAvailable) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "Slither not found",
                detail:
                  "analyze_contract requires Slither to be installed: pip install slither-analyzer. " +
                  "Set SLITHER_PATH env var if Slither is not in PATH. " +
                  "Alternatively, deploy this server on Railway/Fly.io with Slither pre-installed.",
                address,
                network,
              }),
            },
          ],
        };
      }

      // Fetch source code
      const taikoscan = new TaikoscanClient();
      const sourceRaw = (await taikoscan.getContractSource(address, network as Network)) as Array<{
        SourceCode: string;
        ContractName: string;
        CompilerVersion: string;
      }>;

      if (!sourceRaw || sourceRaw.length === 0 || !sourceRaw[0]?.SourceCode) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "Source code not found",
                detail:
                  "The contract source code is not verified on Taikoscan. " +
                  "Verify the contract first at https://taikoscan.io/verifyContract",
                address,
                network,
              }),
            },
          ],
        };
      }

      const sourceEntry = sourceRaw[0];
      let sourceCode = sourceEntry.SourceCode;
      // Handle multi-file contracts (Etherscan format wraps in {{ }})
      if (sourceCode.startsWith("{{")) {
        try {
          const parsed = JSON.parse(sourceCode.slice(1, -1)) as {
            sources: Record<string, { content: string }>;
          };
          // Use the main contract file (first one)
          const firstFile = Object.values(parsed.sources)[0];
          sourceCode = firstFile?.content ?? sourceCode;
        } catch {
          // Keep raw source if parsing fails
        }
      }

      // Run Slither in a temp directory
      const tmpDir = await mkdtemp(join(tmpdir(), "taiko-explorer-"));
      try {
        const analysis = await runSlither(sourceCode, tmpDir);

        const findings = analysis.detectors.map((d) => ({
          check: d.check,
          impact: d.impact,
          confidence: d.confidence,
          description: d.description,
        }));

        const highImpact = findings.filter((f) => f.impact === "High");
        const mediumImpact = findings.filter((f) => f.impact === "Medium");

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                address,
                network,
                contractName: sourceEntry.ContractName,
                compilerVersion: sourceEntry.CompilerVersion,
                summary: {
                  total: findings.length,
                  high: highImpact.length,
                  medium: mediumImpact.length,
                  low: findings.filter((f) => f.impact === "Low").length,
                  informational: findings.filter((f) => f.impact === "Informational").length,
                },
                findings,
              }),
            },
          ],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "Slither analysis failed",
                detail: message,
                address,
                network,
                suggestion:
                  "Slither may fail on contracts with complex import paths or Solidity version mismatches. " +
                  "Try running Slither manually: slither contract.sol --json -",
              }),
            },
          ],
        };
      } finally {
        await rm(tmpDir, { recursive: true, force: true });
      }
    }
  );
}
