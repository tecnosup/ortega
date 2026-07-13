import { getLandingSettings } from "@/lib/admin-settings";

export const revalidate = 60;

const ATUALIZADO_EM = "12 de julho de 2026";

export default async function PrivacidadePage() {
  const settings = await getLandingSettings().catch(() => null);
  const email = settings?.emailContato || "";
  const endereco = settings?.enderecoTexto || "";

  return (
    <section className="min-h-screen pt-28 pb-24 bg-[#0A0A0A] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/20 to-transparent" />

      <div className="max-w-2xl mx-auto px-6 sm:px-8">
        <span className="text-xs font-semibold tracking-[0.25em] uppercase text-[#C9A84C]">
          Ortega Barber
        </span>
        <h1
          className="text-3xl sm:text-4xl font-bold text-[#F5E6C8] mt-3 mb-2"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Política de Privacidade
        </h1>
        <p className="text-xs text-[#F5E6C8]/35 mb-10">Última atualização: {ATUALIZADO_EM}</p>

        <div className="flex flex-col gap-8 text-sm sm:text-base text-[#F5E6C8]/65 leading-relaxed">
          <p>
            Esta Política de Privacidade descreve como a Ortega Barber coleta, usa e protege as
            informações pessoais dos clientes que utilizam nosso site, sistema de agendamento e
            canais de atendimento, em conformidade com a Lei Geral de Proteção de Dados
            (Lei nº 13.709/2018 — LGPD).
          </p>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-[#F5E6C8]">1. Dados que coletamos</h2>
            <p>
              Coletamos apenas os dados necessários para agendar e realizar os serviços: nome,
              telefone e e-mail informados no agendamento ou no formulário de contato, além do
              histórico de serviços realizados. Não coletamos dados de pagamento no site — a
              cobrança é feita presencialmente na barbearia.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-[#F5E6C8]">2. Como usamos seus dados</h2>
            <p>
              Utilizamos suas informações para confirmar e organizar agendamentos, entrar em
              contato sobre seu atendimento (inclusive por WhatsApp), melhorar nossos serviços e
              cumprir obrigações legais. Não vendemos nem compartilhamos seus dados com terceiros
              para fins de marketing.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-[#F5E6C8]">3. Compartilhamento</h2>
            <p>
              Seus dados podem ser tratados por serviços de infraestrutura que utilizamos para
              operar o sistema (hospedagem e banco de dados), sempre com o objetivo exclusivo de
              viabilizar o funcionamento do agendamento. Esses parceiros são obrigados a manter a
              confidencialidade das informações.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-[#F5E6C8]">4. Seus direitos</h2>
            <p>
              A qualquer momento você pode solicitar acesso, correção ou exclusão dos seus dados,
              bem como revogar consentimentos. Para exercer esses direitos, entre em contato pelos
              nossos canais de atendimento.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-[#F5E6C8]">5. Contato</h2>
            <p>
              Em caso de dúvidas sobre esta política ou sobre o tratamento dos seus dados, fale
              com a gente
              {email ? (
                <>
                  {" "}pelo e-mail{" "}
                  <a href={`mailto:${email}`} className="text-[#C9A84C] hover:underline">
                    {email}
                  </a>
                </>
              ) : (
                <> pelos nossos canais de atendimento</>
              )}
              {endereco ? <> ou pessoalmente em {endereco}</> : null}.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
