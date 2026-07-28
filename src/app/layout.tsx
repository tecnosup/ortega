import type { Metadata, Viewport } from "next";
import "./globals.css";
import Analytics from "@/components/Analytics";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  // Faltava só no site público: /admin e /barbeiro já declaravam. Sem isso o
  // Chrome no Android pinta a barra de endereço com o padrão claro, destoando
  // do manifest e da própria página.
  themeColor: "#b8944a",
};

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Ortega";
const siteDescription =
  "Barbearia premium com cortes clássicos e modernos. Agende seu horário.";

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s — ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  manifest: "/site.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName,
    title: siteName,
    description: siteDescription,
    images: ["/logo-ortega.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["/logo-ortega.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteName,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="antialiased">
      <body className="min-h-screen-safe flex flex-col bg-[#0A0A0A] text-[#F5E6C8]">
        <Analytics />
        {children}
      </body>
    </html>
  );
}
