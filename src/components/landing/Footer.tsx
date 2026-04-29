import Image from "next/image";

const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="bg-[#080808] border-t border-[#C9A84C]/15 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">

          {/* logo + nome */}
          <div className="flex items-center gap-3">
            <Image src="/logo-ortega.png" alt="Ortega Barber" width={36} height={36} className="object-contain opacity-80" />
            <span className="text-[#C9A84C] font-bold tracking-[0.25em] uppercase text-sm">Ortega Barber</span>
          </div>

          {/* links */}
          <div className="flex gap-6 text-xs text-[#F5E6C8]/30 tracking-wider">
            <a href="/privacidade" className="hover:text-[#C9A84C] transition-colors">Privacidade</a>
            <a href="/termos" className="hover:text-[#C9A84C] transition-colors">Termos</a>
            <a href="/contato" className="hover:text-[#C9A84C] transition-colors">Contato</a>
          </div>

          {/* redes */}
          <div className="flex gap-5 text-xs text-[#F5E6C8]/30 tracking-wider">
            <a href="https://wa.me/5512925855538" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors">WhatsApp</a>
            <a href="https://instagram.com/igorortega_" target="_blank" rel="noopener noreferrer" className="hover:text-[#C9A84C] transition-colors">@igorortega_</a>
          </div>

          {/* copyright */}
          <span className="text-xs text-[#F5E6C8]/20">© {year} Ortega Barber</span>
        </div>

        {/* endereço */}
        <div className="mt-6 pt-6 border-t border-[#C9A84C]/08 text-center text-xs text-[#F5E6C8]/20 tracking-wide">
          R. Cap. Neco, 300 — Vila Ana Rosa Novaes · (12) 9258-5538
        </div>
      </div>
    </footer>
  );
}
