// Tipos e utilitários puros — sem imports server-only, seguro para Client Components

export function parsePriceNum(preco: string): number {
  return parseFloat(preco.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
}

export type AgendamentoStatus = "pendente" | "confirmado" | "cancelado" | "concluido" | "nao_compareceu";

export interface LogEntry {
  acao: string;
  adminId: string;
  ts: number;
}

export interface Agendamento {
  id: string;
  nome: string;
  telefone: string;
  servico: string;
  preco: string;
  data: string;
  horario: string;
  status: AgendamentoStatus;
  duracaoMin?: number;
  cupom?: string;
  desconto?: number;
  barbeiroId?: string;
  barbeiroNome?: string;
  visualizadoAdmin?: boolean;
  assinaturaId?: string;       // ID Firestore da assinatura usada
  cobertoPorAssinatura?: boolean;
  historico?: LogEntry[];
  criadoEm: number;
  atualizadoEm: number;
}

export interface ItemExtra {
  id: string;
  descricao: string;
  valor: number;
  tipo: "servico" | "produto";
  criadoEm: number;
}

export interface ItemAtendimento {
  id: string;
  tipo: "servico" | "produto";
  descricao: string;
  valor: number;
  produtoId?: string;
}

export interface AtendimentoAvulso {
  id: string;
  data: string;
  clienteNome: string;
  clienteTelefone?: string;
  agendamentoId?: string;
  formaPagamento?: string;
  itens: ItemAtendimento[];
  total: number;
  criadoEm: number;
  atualizadoEm: number;
}

export interface FechamentoDia {
  id: string;
  data: string;
  agendamentos: Agendamento[];
  extras?: ItemExtra[];
  avulsos?: AtendimentoAvulso[];
  totalServicos: number;
  quantidadeAtendidos: number;
  fechadoEm: number;
}
