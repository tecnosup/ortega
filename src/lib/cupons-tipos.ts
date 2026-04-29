export type TipoCupom = "percentual" | "fixo";

export interface Cupom {
  id: string;
  codigo: string;
  descricao: string;
  tipo: TipoCupom;
  valor: number;
  ativo: boolean;
  usoMaximo: number | null;
  usoAtual: number;
  criadoEm: number;
  atualizadoEm: number;
}

export function calcularDesconto(cupom: Cupom, precoOriginal: number): number {
  if (cupom.tipo === "percentual") {
    return parseFloat(((precoOriginal * cupom.valor) / 100).toFixed(2));
  }
  return Math.min(cupom.valor, precoOriginal);
}
