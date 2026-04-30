import type { Metadata } from "next";
import Sidebar from "@/components/sidebar";
import SiteHeader from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "MRLD — Pazaryeri Gelir Kayıp Tespiti",
  description:
    "Pazaryeri hakedişlerinde komisyon farkları, eksik ödemeler ve eksik iadeleri tespit edin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full bg-[#0b0d12] text-zinc-100 selection:bg-violet-500/30">
        <div className="flex min-h-screen">
          {/* Sidebar self-hides on /, /login, /register */}
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
