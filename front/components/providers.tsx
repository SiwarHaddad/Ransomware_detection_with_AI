// components/providers.tsx
"use client"; // <-- Mark this wrapper as a client component

import type React from "react";
import { AppProvider } from "@/context/app-context";
import { Toaster } from "@/components/ui/toaster";
// Import ThemeProvider if you use it globally
// import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // If using ThemeProvider, wrap AppProvider with it
    // <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppProvider>
        {children}
        <Toaster />
      </AppProvider>
    // </ThemeProvider>
  );
}