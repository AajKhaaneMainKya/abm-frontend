import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Providers from "./providers";
import Shell from "@/components/shell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sahayak — Agentic ABM",
  description: "Your outbound motion. Automated.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`h-full antialiased ${inter.variable}`}>
        <body className="h-full">
          <Providers>
            <Shell>{children}</Shell>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
