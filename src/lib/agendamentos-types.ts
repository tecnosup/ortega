// Tipos e utilitários puros — sem imports server-only, seguro para Client Components

export function parsePriceNum(preco: string): number {
  return parseFloat(preco.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
}

/**
 * Extrai a duração em minutos de um serviço.
 * Prioridade: campo numérico `duracaoMin` → parse do texto legado ("45 min" → 45)
 * → `fallback` (default 30, tipicamente o passo da grade).
 * Aceita "1h", "1h30", "1:30" no texto legado.
 */
export function resolverDuracaoMin(
  svc: { duracaoMin?: number; duracao?: string } | null | undefined,
  fallback = 30
): number {
  if (svc?.duracaoMin && svc.duracaoMin > 0) return Math.round(svc.duracaoMin);
  const txt = (svc?.duracao ?? "").trim().toLowerCase();
  if (txt) {
    // "1h30", "1h", "1:30"
    const hm = txt.match(/(\d+)\s*[h:]\s*(\d+)?/);
    if (hm) {
      const h = parseInt(hm[1], 10) || 0;
      const m = hm[2] ? parseInt(hm[2], 10) : 0;
      const total = h * 60 + m;
      if (total > 0) return total;
    }
    // primeiro número solto = minutos ("45 min", "45")
    const nm = txt.match(/(\d+)/);
    if (nm) {
      const n = parseInt(nm[1], 10);
      if (n > 0) return n;
    }
  }
  return fallback;
}

/**
 * Normaliza um valor cru (form/body) para duração em minutos válida ou undefined.
 * Aceita number ou string numérica. Fora da faixa 5–480 → clamp; vazio/inválido → undefined.
 */
export function sanitizarDuracaoMin(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : parseInt(String(v ?? "").trim(), 10);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.min(480, Math.max(5, Math.round(n)));
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
  confirmadoAuto?: boolean;    // confirmado automaticamente (por tempo ou modo automático)
  avisoPendente?: boolean;     // auto-confirmado mas cliente ainda não foi avisado (mandar WhatsApp)
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
  comandas?: import("./comandas-types").Comanda[];
  totalServicos: number;
  quantidadeAtendidos: number;
  fechadoEm: number;
}
