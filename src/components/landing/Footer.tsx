"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const year = new Date().getFullYear();

export default function Footer() {
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    fetch("/api/publico/settings")
      .then((r) => r.json())
      .then((d) => { if (d.whatsappNumber) setWhatsapp(d.whatsappNumber); });
  }, []);

  return (
    <footer className="bg-[#080808] border-t border-[#C9A84C]/15 pt-10 md:pt-12 pb-[calc(2.5rem+env(safe-area-inset-bottom))] md:pb-[calc(3rem+env(safe-area-inset-bottom))]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:flex md:flex-row md:items-center md:justify-between gap-6 md:gap-8">

          {/* logo + nome — ocupa linha inteira no mobile */}
          <div className="col-span-2 flex items-center gap-3">
            <Image src="/logo-ortega.png" alt="Ortega" width={32} height={32} className="object-contain opacity-80" />
            <span className="text-[#C9A84C] font-bold tracking-[0.25em] uppercase text-sm">Ortega</span>
          </div>

          {/* links navegação */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-xs text-[#F5E6C8]/30 tracking-wider">
            <a href="/privacidade" className="hover:text-[#C9A84C] transition-colors">Privacidade</a>
            <a href="/termos" className="hover:text-[#C9A84C] transition-colors">Termos</a>
            <a href="/contato" className="hover:text-[#C9A84C] transition-colors">Contato</a>
          </div>

          {/* redes */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 text-xs text-[#F5E6C8]/30 tracking-wider">
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors">WhatsApp</a>
            )}
            <a href="#" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors">Instagram</a>
          </div>

          <span className="col-span-2 md:col-span-1 text-xs text-[#F5E6C8]/20 md:text-right">© {year} Ortega</span>
        </div>

        <div className="mt-6 pt-6 border-t border-[#C9A84C]/8 text-center text-xs text-[#F5E6C8]/20 tracking-wide">
          R. Cap. Neco, 300 — Vila Ana Rosa Novaes · (12) 99258-5538
        </div>
      </div>
    </footer>
  );
}
