/**
 * Output formatting for the Taiko CLI.
 * Every command supports --json for AI agent compatibility.
 */

export type OutputMode = "human" | "json";
export type CommandStatus = "success" | "error" | "warning";

export interface CommandResult<T = unknown> {
  schema_version: "1.0";
  command: string;
  status: CommandStatus;
  network: string;
  data: T;
  errors: string[];
  warnings: string[];
  metrics: { latency_ms: number };
}

/** Build a success result. */
export function ok<T>(
  command: string,
  network: string,
  data: T,
  opts: { warnings?: string[]; latency_ms?: number } = {}
): CommandResult<T> {
  return {
    schema_version: "1.0",
    command,
    status: "success",
    network,
    data,
    errors: [],
    warnings: opts.warnings ?? [],
    metrics: { latency_ms: opts.latency_ms ?? 0 },
  };
}

/** Build an error result. */
export function err<T = null>(
  command: string,
  network: string,
  errors: string[],
  data: T = null as T
): CommandResult<T> {
  return {
    schema_version: "1.0",
    command,
    status: "error",
    network,
    data,
    errors,
    warnings: [],
    metrics: { latency_ms: 0 },
  };
}

/** Print a CommandResult to stdout. */
export function output<T>(result: CommandResult<T>, mode: OutputMode): void {
  if (mode === "json") {
    console.log(JSON.stringify(result, bigintReplacer, 2));
    return;
  }

  // Human-readable output
  const prefix = result.status === "success" ? "✓" : "✗";
  const statusColor = result.status === "success" ? "\x1b[32m" : "\x1b[31m";
  const reset = "\x1b[0m";

  console.log(`${statusColor}${prefix}${reset} ${result.command} [${result.network}]`);

  if (result.errors.length > 0) {
    for (const e of result.errors) {
      console.error(`  Error: ${e}`);
    }
  }

  if (result.warnings.length > 0) {
    for (const w of result.warnings) {
      console.warn(`  Warning: ${w}`);
    }
  }

  if (result.data !== null && result.data !== undefined) {
    printData(result.data);
  }
}

function printData(data: unknown, indent = "  "): void {
  if (typeof data === "object" && data !== null) {
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        console.log(`${indent}${key}:`);
        printData(value, indent + "  ");
      } else {
        console.log(`${indent}${key}: ${formatValue(value)}`);
      }
    }
  } else {
    console.log(`${indent}${data}`);
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

/** JSON.stringify replacer for BigInt values. */
function bigintReplacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? value.toString() : value;
}

/**
 * Time an async operation and return [result, latencyMs].
 */
export async function timed<T>(fn: () => Promise<T>): Promise<[T, number]> {
  const start = Date.now();
  const result = await fn();
  return [result, Date.now() - start];
}
