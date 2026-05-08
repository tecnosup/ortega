export default function Localizacao({
  enderecoTexto,
  enderecoEmbed,
}: {
  enderecoTexto: string;
  enderecoEmbed: string;
}) {
  if (!enderecoEmbed) return null;

  return (
    <section className="py-16 md:py-24 bg-[#0A0A0A] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent" />

      <div className="max-w-5xl mx-auto px-6 sm:px-8">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold tracking-[0.25em] uppercase text-[#C9A84C]">
              Onde nos encontrar
            </span>
            <h2
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#F5E6C8]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Nossa localização
            </h2>
            {enderecoTexto && (
              <p className="text-sm sm:text-base text-[#F5E6C8]/60 leading-relaxed max-w-md">
                {enderecoTexto}
              </p>
            )}
          </div>

          <div className="relative rounded-sm overflow-hidden border border-[#2d2d2d] shadow-[0_0_40px_rgba(0,0,0,0.6)]">
            <div className="absolute inset-0 pointer-events-none z-10 rounded-sm ring-1 ring-inset ring-[#C9A84C]/10" />
            <iframe
              src={enderecoEmbed}
              width="100%"
              height="400"
              style={{ border: 0, display: "block", filter: "grayscale(30%) contrast(1.05)" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização da Ortega Barber"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
