import type { Agendamento, AgendamentoStatus, FechamentoDia } from "./agendamentos";

// Stores em memória — dados somem ao reiniciar o servidor (apenas para demo)
const store = new Map<string, Agendamento>();
const fechamentosStore = new Map<string, FechamentoDia>();

// Slots bloqueados pelo admin: chave = "YYYY-MM-DD|HH:MM"
const slotsBloqueados = new Set<string>();

export function bloquearSlot(data: string, horario: string): void {
  slotsBloqueados.add(`${data}|${horario}`);
}

export function desbloquearSlot(data: string, horario: string): void {
  slotsBloqueados.delete(`${data}|${horario}`);
}

export function listarSlotsBloqueados(data: string): string[] {
  const prefix = `${data}|`;
  return Array.from(slotsBloqueados)
    .filter((k) => k.startsWith(prefix))
    .map((k) => k.split("|")[1]);
}

function gerarId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

// Seed com agendamentos de hoje para demo imediata
function seed() {
  const dataHoje = hoje();
  const base = [
    { nome: "Carlos Silva", telefone: "11987654321", servico: "Corte Clássico", preco: "55", horario: "09:00", status: "confirmado" as AgendamentoStatus },
    { nome: "Felipe Souza", telefone: "11976543210", servico: "Combo Corte + Barba", preco: "90", horario: "09:30", status: "confirmado" as AgendamentoStatus },
    { nome: "André Lima", telefone: "11965432109", servico: "Barba Completa", preco: "45", horario: "10:00", status: "pendente" as AgendamentoStatus },
    { nome: "Bruno Costa", telefone: "11954321098", servico: "Corte Clássico", preco: "55", horario: "10:30", status: "pendente" as AgendamentoStatus },
    { nome: "Rafael Mendes", telefone: "11943210987", servico: "Sobrancelha", preco: "25", horario: "11:00", status: "confirmado" as AgendamentoStatus },
  ];
  base.forEach((ag) => {
    const id = gerarId();
    const now = Date.now();
    store.set(id, { ...ag, id, data: dataHoje, criadoEm: now, atualizadoEm: now });
  });
}

seed();

export function democriarAgendamento(
  data: Omit<Agendamento, "id" | "status" | "criadoEm" | "atualizadoEm">
): string {
  const id = gerarId();
  const now = Date.now();
  store.set(id, { ...data, id, status: "pendente", criadoEm: now, atualizadoEm: now });
  return id;
}

export function demolistarAgendamentos(): Agendamento[] {
  return Array.from(store.values()).sort((a, b) => {
    if (a.data !== b.data) return b.data.localeCompare(a.data);
    return a.horario.localeCompare(b.horario);
  });
}

export function demogetAgendamento(id: string): Agendamento | null {
  return store.get(id) ?? null;
}

export function demoatualizarAgendamento(
  id: string,
  data: Partial<Omit<Agendamento, "id" | "criadoEm">>
): boolean {
  const ag = store.get(id);
  if (!ag) return false;
  store.set(id, { ...ag, ...data, atualizadoEm: Date.now() });
  return true;
}

export function demoexcluirAgendamento(id: string): boolean {
  return store.delete(id);
}

export function demofecharCaixaDia(data: string): FechamentoDia {
  const agsDia = Array.from(store.values()).filter(
    (a) => a.data === data && a.status === "concluido"
  );
  const total = agsDia.reduce((sum, a) => {
    const val = parseFloat(a.preco.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
    return sum + val;
  }, 0);
  const id = gerarId();
  const fechamento: FechamentoDia = {
    id,
    data,
    agendamentos: agsDia,
    totalServicos: total,
    quantidadeAtendidos: agsDia.length,
    fechadoEm: Date.now(),
  };
  fechamentosStore.set(id, fechamento);
  return fechamento;
}

export function demolistarFechamentos(): FechamentoDia[] {
  return Array.from(fechamentosStore.values()).sort((a, b) => b.fechadoEm - a.fechadoEm);
}
