// app/layout.tsx
import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "RansomGuard AI",
  description: "AI-Powered Ransomware Detection and Protection",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure the return statement is clean, no extra spaces/newlines before <html>
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}