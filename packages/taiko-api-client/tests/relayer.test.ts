import { describe, it, expect } from "vitest";
import { normalizeRelayerPageInfo, statusToString, type RelayerEventsResponse } from "../src/relayer.js";

describe("statusToString", () => {
  it("maps known status codes", () => {
    expect(statusToString(0)).toBe("NEW");
    expect(statusToString(1)).toBe("RETRIABLE");
    expect(statusToString(2)).toBe("DONE");
    expect(statusToString(3)).toBe("FAILED");
    expect(statusToString(4)).toBe("RECALLED");
  });

  it("returns UNKNOWN for unsupported codes", () => {
    expect(statusToString(99)).toBe("UNKNOWN");
  });
});

describe("normalizeRelayerPageInfo", () => {
  it("prefers modern relayer pagination fields", () => {
    const response: RelayerEventsResponse = {
      items: [],
      page: 1,
      size: 20,
      total: 0,
      first: true,
      last: false,
      total_pages: 4,
      visible: 20,
    };

    const pageInfo = normalizeRelayerPageInfo(response);
    expect(pageInfo).toEqual({
      first: true,
      last: false,
      totalPages: 4,
      visible: 20,
    });
  });

  it("falls back to legacy end flag", () => {
    const response: RelayerEventsResponse = {
      items: [],
      page: 2,
      size: 20,
      total: 100,
      end: true,
    };

    const pageInfo = normalizeRelayerPageInfo(response);
    expect(pageInfo).toEqual({
      first: false,
      last: true,
      totalPages: null,
      visible: null,
    });
  });
});
