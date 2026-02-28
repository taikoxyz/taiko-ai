/**
 * Function signature lookup via openchain.xyz and 4byte.directory.
 * Used by decode_calldata to resolve 4-byte selectors.
 */

interface OpenChainResult {
  ok: boolean;
  result: {
    function: Record<string, Array<{ name: string; filtered: boolean }>>;
  };
}

interface FourByteResult {
  count: number;
  results: Array<{ id: number; text_signature: string; hex_signature: string }>;
}

/**
 * Look up a function signature from openchain.xyz (primary).
 * Returns the first non-filtered match, or null if not found.
 */
export async function lookupFromOpenchain(selector: string): Promise<string | null> {
  try {
    const url = `https://api.openchain.xyz/signature-database/v1/lookup?function=${selector}&filter=true`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return null;
    const data = (await resp.json()) as OpenChainResult;
    const matches = data.result?.function?.[selector];
    if (matches && matches.length > 0) {
      return matches[0]?.name ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Look up a function signature from 4byte.directory (fallback).
 * Returns the first match, or null if not found.
 */
export async function lookupFromFourByte(selector: string): Promise<string | null> {
  try {
    const url = `https://www.4byte.directory/api/v1/signatures/?hex_signature=${selector}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) return null;
    const data = (await resp.json()) as FourByteResult;
    if (data.count > 0 && data.results[0]) {
      return data.results[0].text_signature;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Look up a function signature by 4-byte selector.
 * Tries openchain.xyz first, then 4byte.directory as fallback.
 */
export async function lookupSignature(selector: string): Promise<string | null> {
  const openchain = await lookupFromOpenchain(selector);
  if (openchain) return openchain;
  return lookupFromFourByte(selector);
}
