const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-12">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-500">
        <div className="w-20 h-7 bg-gray-200 flex items-center justify-center text-xs text-gray-400">
          [LOGO]
        </div>

        <div className="flex gap-6">
          <a href="/privacidade" className="hover:text-gray-900 transition">Privacidade</a>
          <a href="/termos" className="hover:text-gray-900 transition">Termos</a>
          <a href="/contato" className="hover:text-gray-900 transition">Contato</a>
        </div>

        <div className="flex gap-4">
          {/* insira links de redes sociais aqui */}
          <span className="text-gray-300">[Instagram]</span>
          <span className="text-gray-300">[Facebook]</span>
          <span className="text-gray-300">[WhatsApp]</span>
        </div>

        <span>© {year} Nome da Empresa</span>
      </div>
    </footer>
  );
}
