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
  title: "Sahayak — The hiring layer for Indian startups",
  description:
    "Post what you need. Get matched candidates who have actually built what you are looking for. Verified domain. Weighted matching. No recruiter spam.",
  openGraph: {
    title: "Sahayak — The hiring layer for Indian startups",
    description:
      "Post what you need. Get matched candidates who have actually built what you are looking for.",
    url: "https://sahayakhq.co",
    siteName: "Sahayak",
    images: [
      {
        url: "https://sahayakhq.co/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sahayak — The hiring layer for Indian startups",
    description:
      "Post what you need. Get matched candidates who have actually built what you are looking for.",
  },
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
