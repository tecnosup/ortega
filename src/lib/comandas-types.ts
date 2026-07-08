// Tipos puros da COMANDA — sem imports server-only, seguro para Client Components.
//
// A Comanda é a entidade central do sistema ("o ouro"): unifica agendamento e
// atendimento avulso numa base única para estoque, financeiro e comissões.

export type ComandaStatus = "aberta" | "finalizada" | "cancelada";
export type OrigemComanda = "agendamento" | "avulsa";

export interface ItemComanda {
  id: string;
  tipo: "servico" | "produto";
  descricao: string;
  valor: number;
  quantidade?: number;   // default 1
  produtoId?: string;    // referência p/ baixa de estoque
}

export interface ComandaLog {
  acao: string;
  adminId: string;
  ts: number;
}

export interface Comanda {
  id: string;
  status: ComandaStatus;
  origem: OrigemComanda;
  agendamentoId?: string;  // rastreabilidade quando origem = agendamento
  // cliente
  clienteNome: string;
  clienteTelefone?: string;
  // agendamento (quando origem = agendamento)
  data: string;            // "YYYY-MM-DD" (dia do atendimento)
  horario?: string;        // "HH:MM"
  barbeiroId?: string;
  barbeiroNome?: string;
  // itens e valores
  itens: ItemComanda[];
  total: number;           // soma dos itens (após desconto)
  formaPagamento?: string; // definido na finalização
  // cupom / assinatura (herdado do fluxo de agendamento)
  cupom?: string;
  desconto?: number;
  assinaturaId?: string;
  cobertoPorAssinatura?: boolean;
  // controle
  historico?: ComandaLog[];
  criadoEm: number;
  atualizadoEm: number;
  finalizadoEm?: number;
}

/** Soma os itens respeitando quantidade (default 1). */
export function calcularTotalItens(itens: ItemComanda[]): number {
  return itens.reduce((s, i) => s + i.valor * (i.quantidade ?? 1), 0);
}
