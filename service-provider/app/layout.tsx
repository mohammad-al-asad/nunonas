import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: { default: "Activity Planner", template: "%s | Activity Planner" },
  description: "Activity Planner service provider portal.",
  icons: { icon: "/activity-planner-logo.png", apple: "/activity-planner-logo.png" }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
