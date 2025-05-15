"use client";

import { CacheProvider } from "@emotion/react";
import { ReactNode } from "react";
import { createEmotionCache } from "../lib/emotion-cache";

const clientSideEmotionCache = createEmotionCache();

export function EmotionProvider({ children }: { children: ReactNode }) {
  return (
    <CacheProvider value={clientSideEmotionCache}>
      {children}
    </CacheProvider>
  );
} 