import { describe, expect, it } from "vitest";
import { parseCsvBuffer } from "../utils/csv.js";

describe("parseCsvBuffer", () => {
  it("parses CSV headers, rows, and preview", async () => {
    const parsed = await parseCsvBuffer(Buffer.from("Name,Email\nA,a@example.com\nB,b@example.com"));

    expect(parsed.headers).toEqual(["Name", "Email"]);
    expect(parsed.statistics.totalRows).toBe(2);
    expect(parsed.preview).toHaveLength(2);
  });
});

