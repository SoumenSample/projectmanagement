import { Rubik } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { Providers } from "@/components/providers";

const rubik = Rubik({
  weight: ["400", "500", "700"],
  variable: "--font-rubik",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              try {
                var stored = localStorage.getItem("theme");
                var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                var theme = stored || (systemDark ? "dark" : "light");
                document.documentElement.classList.toggle("dark", theme === "dark");
              } catch (e) {}
            })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${rubik.className} min-h-screen bg-background text-foreground antialiased`}
      >
        <Providers>
          <main className="relative min-h-screen w-full">{children}</main>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
