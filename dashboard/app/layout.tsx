import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Activity Planner",
  description: "Activity Planner administration dashboard",
  icons: { icon: "/activity-planner-logo.png", apple: "/activity-planner-logo.png" }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
