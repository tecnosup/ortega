import type { Metadata } from "next";
import "./globals.css";
import Analytics from "@/components/Analytics";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME ?? "Ortega Barber",
  description: "Barbearia premium com cortes clássicos e modernos. Agende seu horário.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0A0A0A] text-[#F5E6C8]">
        <Analytics />
        {children}
      </body>
    </html>
  );
}
