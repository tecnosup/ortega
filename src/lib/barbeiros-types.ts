export interface Barbeiro {
  id: string;
  nome: string;
  apelido?: string;
  foto?: string;
  comissao: number;
  ativo: boolean;
  uid?: string;
  email?: string;
  createdAt: number;
  updatedAt: number;
}
