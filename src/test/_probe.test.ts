import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";

describe("probe", () => {
  it("prints shape", () => {
    const ch = (routeTree as any).children as any[];
    const first = ch[0];
    console.log("options keys:", Object.keys(first.options).join(","));
    ch.forEach(c => console.log("child:", JSON.stringify(c.options.id), "path:", JSON.stringify(c.options.path), "fullPath:", JSON.stringify(c.options.fullPath), "subchildren:", (c.children ?? []).length));
    expect(true).toBe(true);
  });
});
