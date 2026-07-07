export const dynamic = "force-dynamic";

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Ortega Admin",
  description: "Painel administrativo da Ortega",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ortega Admin",
  },
};

export const viewport: Viewport = {
  themeColor: "#b8944a",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
