export default function CtaFinal() {
  return (
    <section className="py-24 bg-[#b8944a]">
      <div className="max-w-2xl mx-auto px-6 text-center flex flex-col gap-6">
        <h2 className="text-3xl font-bold text-white">Pronto para uma nova versão de você?</h2>
        <p className="text-white/80">
          Agende seu horário agora e experimente o cuidado premium que você merece.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a
            href="/agendamento"
            className="inline-flex items-center px-8 py-3 bg-white text-[#1a1a1a] text-sm font-semibold hover:bg-gray-100 transition"
          >
            Agendar horário
          </a>
          <a
            href="https://wa.me/5511999999999?text=Olá! Gostaria de agendar um horário na Ortega Barber."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-8 py-3 border-2 border-white text-white text-sm font-medium hover:bg-white hover:text-[#1a1a1a] transition"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
