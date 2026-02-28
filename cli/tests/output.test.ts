import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ok, err, output, timed } from "../src/lib/output.js";

describe("ok()", () => {
  it("builds a success result with all required fields", () => {
    const result = ok("test command", "mainnet", { foo: "bar" });
    expect(result.schema_version).toBe("1.0");
    expect(result.command).toBe("test command");
    expect(result.status).toBe("success");
    expect(result.network).toBe("mainnet");
    expect(result.data).toEqual({ foo: "bar" });
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(result.metrics.latency_ms).toBe(0);
  });

  it("includes warnings when provided", () => {
    const result = ok("cmd", "mainnet", {}, { warnings: ["warn1", "warn2"] });
    expect(result.warnings).toEqual(["warn1", "warn2"]);
  });

  it("includes latency_ms when provided", () => {
    const result = ok("cmd", "hoodi", {}, { latency_ms: 42 });
    expect(result.metrics.latency_ms).toBe(42);
  });
});

describe("err()", () => {
  it("builds an error result with required fields", () => {
    const result = err("test command", "mainnet", ["something went wrong"]);
    expect(result.schema_version).toBe("1.0");
    expect(result.command).toBe("test command");
    expect(result.status).toBe("error");
    expect(result.network).toBe("mainnet");
    expect(result.errors).toEqual(["something went wrong"]);
    expect(result.warnings).toHaveLength(0);
  });

  it("accepts multiple error messages", () => {
    const result = err("cmd", "hoodi", ["err1", "err2"]);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toBe("err1");
    expect(result.errors[1]).toBe("err2");
  });

  it("accepts optional data payload", () => {
    const result = err("cmd", "mainnet", ["oops"], { partial: true });
    expect(result.data).toEqual({ partial: true });
  });
});

describe("output()", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("json mode prints valid JSON with all fields", () => {
    const result = ok("my cmd", "mainnet", { value: 42 });
    output(result, "json");
    expect(logSpy).toHaveBeenCalledOnce();
    const printed = logSpy.mock.calls[0]?.[0] as string;
    const parsed = JSON.parse(printed) as typeof result;
    expect(parsed.schema_version).toBe("1.0");
    expect(parsed.status).toBe("success");
    expect(parsed.data).toEqual({ value: 42 });
  });

  it("json mode handles BigInt values without throwing", () => {
    const result = ok("cmd", "mainnet", { bigValue: BigInt("12345678901234567890") });
    expect(() => output(result, "json")).not.toThrow();
    const printed = logSpy.mock.calls[0]?.[0] as string;
    expect(printed).toContain("12345678901234567890");
  });

  it("human mode prints to console without throwing", () => {
    const result = ok("cmd", "mainnet", { key: "value" });
    expect(() => output(result, "human")).not.toThrow();
    expect(logSpy).toHaveBeenCalled();
  });

  it("human mode prints error messages via console.error", () => {
    const result = err("cmd", "mainnet", ["critical error"]);
    output(result, "human");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("critical error"));
  });
});

describe("timed()", () => {
  it("returns the function result and a non-negative latency", async () => {
    const [result, latency] = await timed(async () => 99);
    expect(result).toBe(99);
    expect(latency).toBeGreaterThanOrEqual(0);
  });

  it("propagates errors from the wrapped function", async () => {
    await expect(
      timed(async () => {
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");
  });
});
