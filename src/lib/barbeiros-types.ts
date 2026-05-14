export interface ComissaoServico {
  servicoId: string;
  percentual: number;
}

export interface Barbeiro {
  id: string;
  nome: string;
  apelido?: string;
  foto?: string;
  comissao: number;
  ativo: boolean;
  uid?: string;
  email?: string;
  tipo?: "barbeiro" | "faxineira" | "secretaria";
  comissoesServico?: ComissaoServico[];
  createdAt: number;
  updatedAt: number;
}
