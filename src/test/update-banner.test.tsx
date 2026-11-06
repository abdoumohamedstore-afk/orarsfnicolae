import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refreshApp = vi.fn();
vi.mock("@/lib/pwa", () => ({
  OFFLINE_PAGES: ["/"],
  setupServiceWorker: (callbacks?: { onUpdate?: () => void }) => {
    callbacks?.onUpdate?.();
    return Promise.resolve();
  },
  refreshApp: (...args: unknown[]) => refreshApp(...args),
}));

import { AppProvider } from "@/lib/store";
import { AppStatus } from "@/components/app-status";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("Update banner", () => {
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
  });

  it("shows a reload button when a new version is available and reloads on tap", async () => {
    await act(async () => {
      root.render(
        <AppProvider>
          <AppStatus />
        </AppProvider>,
      );
    });

    expect(host.textContent).toContain("Update available");
    const button = host.querySelector("button");
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe("Reload");

    await act(async () => button!.click());
    expect(refreshApp).toHaveBeenCalledTimes(1);
  });
});
