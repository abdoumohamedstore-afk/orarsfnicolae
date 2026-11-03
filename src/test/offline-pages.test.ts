import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { OFFLINE_PAGES } from "@/lib/pwa";

type Node = { options?: { path?: string }; children?: Node[] };

/** Collect every page path the router can match, skipping the one-time QR accept
 *  page, which is only useful while online. */
function pagePaths(node: Node, found = new Set<string>()): Set<string> {
  const path = node.options?.path;
  if (path && !path.startsWith("/share")) found.add(path);
  for (const child of node.children ?? []) pagePaths(child, found);
  return found;
}

describe("Offline page priming", () => {
  const pages = pagePaths(routeTree as unknown as Node);

  it("finds the five tab pages plus the timetable editor", () => {
    expect([...pages].sort()).toEqual(["/", "/calendar", "/edit", "/homework", "/settings", "/week"]);
  });

  it("primes every content page for offline use", () => {
    expect(pages.size).toBeGreaterThan(0);
    expect([...pages].filter(p => !OFFLINE_PAGES.includes(p))).toEqual([]);
  });

  it("never primes a page the router cannot match", () => {
    expect(OFFLINE_PAGES.filter(p => !pages.has(p))).toEqual([]);
  });
});
