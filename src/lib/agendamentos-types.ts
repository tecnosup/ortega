// Tipos e utilitários puros — sem imports server-only, seguro para Client Components

export function parsePriceNum(preco: string): number {
  return parseFloat(preco.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
}

export type AgendamentoStatus = "pendente" | "confirmado" | "cancelado" | "concluido" | "nao_compareceu";

export interface Agendamento {
  id: string;
  nome: string;
  telefone: string;
  servico: string;
  preco: string;
  data: string;
  horario: string;
  status: AgendamentoStatus;
  cupom?: string;
  desconto?: number;
  barbeiroId?: string;
  barbeiroNome?: string;
  visualizadoAdmin?: boolean;
  assinaturaId?: string;       // ID Firestore da assinatura usada
  cobertoPorAssinatura?: boolean;
  criadoEm: number;
  atualizadoEm: number;
}

export interface FechamentoDia {
  id: string;
  data: string;
  agendamentos: Agendamento[];
  totalServicos: number;
  quantidadeAtendidos: number;
  fechadoEm: number;
}
