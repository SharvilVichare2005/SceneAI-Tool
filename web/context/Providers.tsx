"use client";

import { ThemeProvider } from "@/context/ThemeContext";
import { ServerProvider } from "@/context/ServerContext";
import { AuthGate, AuthProvider } from "@/context/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider><ServerProvider><AuthProvider><AuthGate>{children}</AuthGate></AuthProvider></ServerProvider></ThemeProvider>
  );
}
