import "server-only";

// Formata data "YYYY-MM-DD" para "seg, 12 jan" (padrão usado em todas as mensagens de push)
export function formatarDataCurta(data: string): string {
  return new Date(data + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export interface PushAgendamento {
  nome: string;
  servico: string;
  data: string;
  horario: string;
  barbeiroNome?: string | null;
}

export function pushNovoAgendamento(ag: PushAgendamento) {
  const barbeiroLabel = ag.barbeiroNome ? ` com ${ag.barbeiroNome}` : "";
  return {
    title: `✂️ Novo agendamento${barbeiroLabel}`,
    body: `${ag.nome} · ${ag.servico} · ${formatarDataCurta(ag.data)} às ${ag.horario}`,
  };
}

export function pushVencimentoProximo(descricao: string, dias: number, valor: number) {
  const valorFmt = valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const prazo = dias <= 0 ? "vence hoje" : dias === 1 ? "vence amanhã" : `vence em ${dias} dias`;
  return {
    title: `💰 Vencimento próximo`,
    body: `${descricao} (${valorFmt}) ${prazo}`,
  };
}
