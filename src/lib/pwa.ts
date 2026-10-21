// The only app-shell SW registrar. Preview/dev never register this worker.
let registration: ServiceWorkerRegistration | undefined;
export async function refreshApp() {
  if (registration?.waiting) {
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  } else window.location.reload();
}
export async function setupServiceWorker(callbacks?: { onReady: () => void; onUpdate: () => void }) {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const h = window.location.hostname;
  let iframe = false; try { iframe = window.self !== window.top; } catch { iframe = true; }
  const refused = !import.meta.env.PROD || iframe || h.startsWith("id-preview--") || h.startsWith("preview--") ||
    ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"].some(domain => h === domain || h.endsWith(`.${domain}`)) || new URLSearchParams(window.location.search).get("sw") === "off";
  if (refused) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter(r => [r.active, r.waiting, r.installing].some(w => w && new URL(w.scriptURL).pathname === "/sw.js")).map(r => r.unregister())); return;
  }
  try {
    registration = await navigator.serviceWorker.register("/sw.js");
    if (registration.waiting) callbacks?.onUpdate();
    registration.addEventListener("updatefound", () => {
      const worker = registration?.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed") { if (navigator.serviceWorker.controller) callbacks?.onUpdate(); else callbacks?.onReady(); }
      });
    });
    if (registration.active) callbacks?.onReady();
  } catch { /* No offline-ready claim if registration fails. */ }
}
