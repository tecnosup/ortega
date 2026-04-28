import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Analytics from "@/components/Analytics";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME ?? "Ortega Barber",
  description: "Barbearia premium com cortes clássicos e modernos. Agende seu horário.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-[#1a1a1a]">
        <Analytics />
        {children}
      </body>
    </html>
  );
}
