"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { NotificationProvider } from "@/context/NotificationContext";
import { QuoteModalProvider } from "@/context/QuoteModalContext";

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SessionProvider>
        <QuoteModalProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </QuoteModalProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
