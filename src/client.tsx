import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";
import { hydrateNativeStorage } from "@/lib/native-storage";

// On iOS/Android restore the durable storage mirror *before* the first
// render so offline caches (food log, auth session, sync queue) are present.
// On the web this resolves immediately.
hydrateNativeStorage()
  .catch(() => {})
  .finally(() => {
    startTransition(() => {
      hydrateRoot(
        document,
        <StrictMode>
          <StartClient />
        </StrictMode>,
      );
    });
  });
