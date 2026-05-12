// Tipos puros — sem server-only, seguro para Client Components

export interface GastoDia {
  id: string;
  data: string;       // YYYY-MM-DD
  descricao: string;
  valor: number;
  criadoEm: number;
}
