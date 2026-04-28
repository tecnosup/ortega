const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] border-t border-[#2d2d2d] py-12">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-400">
        <span className="text-[#b8944a] font-bold text-lg tracking-widest uppercase">
          Ortega Barber
        </span>

        <div className="flex gap-6">
          <a href="/privacidade" className="hover:text-white transition">Privacidade</a>
          <a href="/termos" className="hover:text-white transition">Termos</a>
          <a href="/contato" className="hover:text-white transition">Contato</a>
        </div>

        <div className="flex gap-4">
          <a
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#b8944a] transition"
          >
            WhatsApp
          </a>
          <a href="#" className="hover:text-[#b8944a] transition">Instagram</a>
          <a href="#" className="hover:text-[#b8944a] transition">Facebook</a>
        </div>

        <span>© {year} Ortega Barber</span>
      </div>
    </footer>
  );
}
