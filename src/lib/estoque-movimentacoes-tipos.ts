export type TipoMovimentacao = "venda" | "reposicao" | "devolucao" | "ajuste_manual";

export const TIPO_LABEL: Record<TipoMovimentacao, string> = {
  venda:         "Venda",
  reposicao:     "Reposição",
  devolucao:     "Devolução",
  ajuste_manual: "Ajuste Manual",
};

export interface MovimentacaoEstoque {
  id: string;
  produtoId: string;
  produtoNome: string;
  produtoImagem?: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  obs?: string;
  criadoEm: number;
}
