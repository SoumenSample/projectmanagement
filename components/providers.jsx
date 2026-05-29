"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { NotificationProvider } from "@/context/NotificationContext";
import { QuoteModalProvider } from "@/context/QuoteModalContext";
import { PersistentSkeletonProvider } from "@/components/ui/persistent-skeleton"

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionProvider>
        <QuoteModalProvider>
          <NotificationProvider>
            <PersistentSkeletonProvider>{children}</PersistentSkeletonProvider>
          </NotificationProvider>
        </QuoteModalProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
