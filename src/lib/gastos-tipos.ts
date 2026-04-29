// Tipos e helpers puros — sem imports de firebase-admin (seguro para Client Components)

export type CategoriaGasto =
  | "aluguel"
  | "produtos"
  | "equipamentos"
  | "marketing"
  | "pessoal"
  | "servicos"
  | "outros";

export type FrequenciaGasto = "mensal" | "quinzenal" | "semanal" | "anual" | "unico";

export interface Gasto {
  id: string;
  descricao: string;
  categoria: CategoriaGasto;
  valor: number;
  frequencia: FrequenciaGasto;
  ativo: boolean;
  vencimento: number | null;
  criadoEm: number;
  atualizadoEm: number;
}

export function gastoMensalEquivalente(gasto: Gasto): number {
  switch (gasto.frequencia) {
    case "mensal":    return gasto.valor;
    case "quinzenal": return gasto.valor * 2;
    case "semanal":   return gasto.valor * 4.33;
    case "anual":     return gasto.valor / 12;
    case "unico":     return 0;
    default:          return gasto.valor;
  }
}

export const CATEGORIA_LABEL: Record<CategoriaGasto, string> = {
  aluguel: "Aluguel",
  produtos: "Produtos",
  equipamentos: "Equipamentos",
  marketing: "Marketing",
  pessoal: "Pessoal",
  servicos: "Serviços",
  outros: "Outros",
};

export const FREQUENCIA_LABEL: Record<FrequenciaGasto, string> = {
  mensal: "Mensal",
  quinzenal: "Quinzenal",
  semanal: "Semanal",
  anual: "Anual",
  unico: "Único",
};
