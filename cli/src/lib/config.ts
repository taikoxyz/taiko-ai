import * as yaml from "js-yaml";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export const CONFIG_PATH = join(homedir(), ".taiko", "config.yaml");

export interface NetworkProfile {
  rpc_url: string;
}

export interface TaikoConfig {
  active_network: "mainnet" | "hoodi";
  networks: {
    mainnet: NetworkProfile;
    hoodi: NetworkProfile;
  };
}

const DEFAULT_CONFIG: TaikoConfig = {
  active_network: "mainnet",
  networks: {
    mainnet: {
      rpc_url: "https://rpc.mainnet.taiko.xyz",
    },
    hoodi: {
      rpc_url: "https://rpc.hoodi.taiko.xyz",
    },
  },
};

export function readConfig(configPath = CONFIG_PATH): TaikoConfig {
  if (!existsSync(configPath)) return structuredClone(DEFAULT_CONFIG);
  try {
    return yaml.load(readFileSync(configPath, "utf8")) as TaikoConfig;
  } catch {
    return structuredClone(DEFAULT_CONFIG);
  }
}

export function writeConfig(config: TaikoConfig, configPath = CONFIG_PATH): void {
  mkdirSync(join(configPath, ".."), { recursive: true });
  writeFileSync(configPath, yaml.dump(config), "utf8");
}

/** Get the active network, respecting TAIKO_NETWORK env override. */
export function getActiveNetwork(config: TaikoConfig): "mainnet" | "hoodi" {
  const envNetwork = process.env.TAIKO_NETWORK;
  if (envNetwork === "mainnet" || envNetwork === "hoodi") return envNetwork;
  return config.active_network ?? "mainnet";
}

/** Get the RPC URL for the active network, respecting TAIKO_RPC_URL env override. */
export function getRpcUrl(config: TaikoConfig, network: "mainnet" | "hoodi"): string {
  const envRpc = process.env.TAIKO_RPC_URL;
  if (envRpc) return envRpc;
  return config.networks[network]?.rpc_url ?? DEFAULT_CONFIG.networks[network].rpc_url;
}
