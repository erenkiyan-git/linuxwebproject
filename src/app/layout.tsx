import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Navbar } from "@/components/navigation/Navbar";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "TERMINAL ZERO — Master 200 Linux Commands in 28 Days",
  description:
    "An interactive Linux learning platform with a real in-browser WebAssembly Linux terminal. Master 200 Linux commands through guided hands-on challenges.",
  keywords: ["Linux", "Terminal", "Bash", "Interactive Learning", "DevOps", "WebAssembly", "v86"],
  authors: [{ name: "Terminal Zero Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0D12] text-[#F4F6FA] min-h-screen flex flex-col antialiased selection:bg-[#8B7CFF]/30 selection:text-[#F4F6FA]">
        <Suspense
          fallback={
            <div className="h-14 w-full bg-[#0B0D12] border-b border-[#272D39]" />
          }
        >
          <Navbar />
        </Suspense>
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
