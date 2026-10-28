"use client";

import { useSyncExternalStore } from "react";

const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

// Alt is labelled Option on Mac keyboards. The server renders Alt.
export function AltKey() {
  const mac = useSyncExternalStore(() => () => {}, isMac, () => false);
  return mac ? "Option" : "Alt";
}
