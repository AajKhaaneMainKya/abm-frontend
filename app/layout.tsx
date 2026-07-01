import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Providers from "./providers";
import Shell from "@/components/shell";
import { WindowManagerProvider } from "@/components/window-manager";

export const metadata: Metadata = {
  title: "Sahayak — Agentic ABM",
  description: "Your outbound motion. Automated.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full antialiased">
        <body className="h-full">
          <Providers>
            <WindowManagerProvider>
              <Shell>{children}</Shell>
            </WindowManagerProvider>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
