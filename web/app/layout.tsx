import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/context/Providers";

export const metadata: Metadata = {
  title: "LabellingApp — AI workspace",
  description: "A production-ready workspace for dataset labeling, model training, and computer-vision inference.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><body><Providers>{children}</Providers></body></html>;
}
