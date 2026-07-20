export const dynamic = "force-dynamic";

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: { absolute: "Ortega — Portal do Barbeiro" },
  description: "Portal exclusivo para barbeiros da Ortega",
  manifest: "/barbeiro.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ortega Barbeiro",
  },
};

export const viewport: Viewport = {
  themeColor: "#b8944a",
};

export default function BarbeiroRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
