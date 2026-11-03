import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { OFFLINE_PAGES } from "@/lib/pwa";

/** Collect every page path the router can match, skipping the root layout and the
 *  one-time QR accept page, which is only useful while online. */
function pagePaths(node: typeof routeTree, found = new Set<string>()): Set<string> {
  if (node.path && node.path !== "/" && !node.path.startsWith("/share")) found.add(node.path);
  for (const child of Object.values(node.children ?? {})) pagePaths(child as typeof routeTree, found);
  return found;
}

describe("Offline page priming", () => {
  const pages = pagePaths(routeTree);

  it("finds the five tab pages plus the timetable editor", () => {
    expect(pages.size).toBe(6);
    expect([...pages].sort()).toEqual(["/calendar", "/edit", "/homework", "/settings", "/week", "/"]);
  });

  it("primes every content page for offline use", () => {
    expect(pages.size).toBeGreaterThan(0);
    expect([...pages].filter(p => !OFFLINE_PAGES.includes(p))).toEqual([]);
  });

  it("never primes a page the router cannot match", () => {
    expect(OFFLINE_PAGES.filter(p => !pages.has(p))).toEqual([]);
  });
});
