import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WatchlistProvider } from "@/hooks/use-watchlist";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Highland Commodity Tracker",
  description: "Commodity price tracking for construction professionals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className={inter.className}>
        <WatchlistProvider>
          {/* Desktop sidebar */}
          <Sidebar />

          {/* Mobile top nav */}
          <MobileNav />

          {/* Main content area -- offset for sidebar on desktop */}
          <main className="min-h-screen md:ml-[220px]">{children}</main>
        </WatchlistProvider>
      </body>
    </html>
  );
}
