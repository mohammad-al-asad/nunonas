import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL("https://meetz4u.xyz"),
  title: {
    default: "Activity Planner: discover and book activities near you",
    template: "%s | Activity Planner",
  },
  description:
    "Activity Planner helps you discover experiences, plan your day with AI and book hotels, spas, restaurants and events in a few taps.",
  openGraph: {
    title: "Activity Planner",
    description: "Discover, plan and book activities near you.",
    url: "https://meetz4u.xyz",
    siteName: "Activity Planner",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
