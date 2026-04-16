// Service worker registration with strict guards so it never runs in
// the Lovable editor preview iframe (which would cache stale builds).

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true; // cross-origin iframe access throws → assume iframe
    }
  })();

  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host.includes("lovable.app") ||
    host === "localhost" ||
    host === "127.0.0.1";

  // In preview/iframe contexts: actively unregister any stale SWs and bail.
  if (isInIframe || isPreviewHost) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        registrations.forEach((r) => r.unregister());
      })
      .catch(() => {});
    return;
  }

  // Production-only registration
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        // Check for updates every hour
        setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000);

        // When a new worker is found, tell it to take over immediately.
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              newWorker.postMessage("SKIP_WAITING");
            }
          });
        });
      })
      .catch(() => {
        // Silent fail — SW is a progressive enhancement
      });

    // Reload once when a new SW takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}
