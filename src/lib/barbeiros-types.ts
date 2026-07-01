export interface ComissaoServico {
  servicoId: string;
  percentual: number;
}

export interface Barbeiro {
  id: string;
  nome: string;
  apelido?: string;
  foto?: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  dataNascimento?: string;
  endereco?: string;
  uid?: string;
  comissao: number;
  ativo: boolean;
  presenteHoje?: boolean;
  tipo?: string;
  comissoesServico?: ComissaoServico[];
  createdAt: number;
  updatedAt: number;
}
