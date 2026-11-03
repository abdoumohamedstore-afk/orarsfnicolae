import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";

describe("probe", () => {
  it("prints shape", () => {
    const r = routeTree as unknown as Record<string, unknown>;
    console.log("root keys:", Object.keys(r).join(","));
    console.log("root path:", JSON.stringify(r["path"]), "id:", JSON.stringify(r["id"]));
    const ch = r["children"] as Record<string, unknown> | unknown[] | undefined;
    console.log("children type:", Array.isArray(ch) ? "array" : typeof ch);
    if (ch) {
      const first = Array.isArray(ch) ? ch[0] : Object.values(ch)[0];
      const f = first as Record<string, unknown>;
      console.log("first child keys:", Object.keys(f).join(","));
      console.log("first child path/id:", JSON.stringify(f["path"]), JSON.stringify(f["id"]));
      console.log("all children ids:", (Array.isArray(ch) ? ch : Object.values(ch)).map(c => JSON.stringify((c as Record<string, unknown>)["id"])).join(" "));
    }
    expect(true).toBe(true);
  });
});
