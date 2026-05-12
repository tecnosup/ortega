// Tipos públicos do sistema de assinaturas — sem imports server-only

export interface PlanoAssinaturaPublico {
  id: string;
  nome: string;
  descricao: string;
  cortes: number;
  precoFormatado: string;
}

export type AssinaturaStatus = "ativa" | "cancelada" | "pausada" | "inadimplente";

export interface AssinaturaResumo {
  id: string;
  planoId: string;
  planoCortesTotal: number;
  cortesRestantes: number;
  status: AssinaturaStatus;
  proximoVencimento: number;
  clienteNome: string;
}

export const PLANOS_PUBLICOS: PlanoAssinaturaPublico[] = [
  { id: "basico",  nome: "Plano Básico",  descricao: "Ideal para quem vai 1 vez por mês",         cortes: 1, precoFormatado: "R$ 59,90" },
  { id: "mensal",  nome: "Plano Mensal",  descricao: "Para quem cuida do visual toda quinzena",    cortes: 2, precoFormatado: "R$ 99,90" },
  { id: "premium", nome: "Plano Premium", descricao: "Corte toda semana, sempre impecável",        cortes: 4, precoFormatado: "R$ 179,90" },
];
