import { MainLayoutShell } from "@/components/main/main-layout-shell";

export default function MainLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MainLayoutShell>{children}</MainLayoutShell>;
}
