import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import Shell from "@/components/shell";

export const metadata: Metadata = {
  title: "ABM System v1.0",
  description: "Agentic Account-Based Marketing — control panel",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full">
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
