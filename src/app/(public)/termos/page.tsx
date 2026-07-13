import { getLandingSettings } from "@/lib/admin-settings";

export const revalidate = 60;

const ATUALIZADO_EM = "12 de julho de 2026";

export default async function TermosPage() {
  const settings = await getLandingSettings().catch(() => null);
  const email = settings?.emailContato || "";

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
          Termos de Uso
        </h1>
        <p className="text-xs text-[#F5E6C8]/35 mb-10">Última atualização: {ATUALIZADO_EM}</p>

        <div className="flex flex-col gap-8 text-sm sm:text-base text-[#F5E6C8]/65 leading-relaxed">
          <p>
            Ao utilizar o site e o sistema de agendamento da Ortega Barber, você concorda com os
            termos descritos abaixo. Recomendamos a leitura atenta antes de realizar um
            agendamento.
          </p>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-[#F5E6C8]">1. Aceitação dos termos</h2>
            <p>
              O uso do nosso site e sistema de agendamento implica na aceitação integral destes
              termos. Caso não concorde com alguma condição, pedimos que não utilize o serviço.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-[#F5E6C8]">2. Agendamentos</h2>
            <p>
              Ao agendar um horário, você se compromete a comparecer na data e hora escolhidas.
              Em caso de imprevisto, pedimos que cancele ou remarque com antecedência pelos nossos
              canais, para que o horário possa ser liberado a outro cliente. Atrasos podem
              resultar em redução do tempo de atendimento ou remarcação, conforme a agenda.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-[#F5E6C8]">3. Serviços e pagamentos</h2>
            <p>
              Os valores e a disponibilidade dos serviços podem ser atualizados a qualquer momento.
              O pagamento é realizado presencialmente na barbearia, no ato do atendimento. O site
              não processa cobranças.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-[#F5E6C8]">4. Responsabilidades</h2>
            <p>
              Empenhamo-nos em manter o sistema disponível e as informações corretas, mas não nos
              responsabilizamos por indisponibilidades temporárias ou por informações inseridas de
              forma incorreta pelo próprio usuário no agendamento.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-[#F5E6C8]">5. Contato</h2>
            <p>
              Dúvidas sobre estes termos podem ser encaminhadas
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
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
