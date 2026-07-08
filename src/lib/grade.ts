// Configuração da grade de horários da barbearia.
// IMPORTANTE: client-safe — NÃO importar firebase-admin aqui (usado no site do cliente).

export interface DiaGrade {
  ativo: boolean;                // dia aberto para agendamento?
  inicio: string;                // "09:00"
  fim: string;                   // "19:00"
  almocoInicio: string | null;   // "12:00" — ou null (sem pausa de almoço)
  almocoFim: string | null;      // "13:00" — ou null
}

// 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
export type GradeConfig = Record<number, DiaGrade>;

// Passo (intervalo) da grade de horários, em minutos. Global para a barbearia.
export const PASSO_DEFAULT = 30;
export const PASSOS_DISPONIVEIS = [5, 10, 15, 20, 30, 60] as const;

// Config completa persistida em settings/grade: os 7 dias + o passo.
// Retrocompat: docs antigos só têm os dias (0..6); passoMin é lido à parte.
export interface GradeDoc extends GradeConfig {
  passoMin?: number;
}

export function normalizarPasso(v: unknown): number {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n) || n <= 0) return PASSO_DEFAULT;
  // arredonda pro passo disponível mais próximo
  return (PASSOS_DISPONIVEIS as readonly number[]).includes(n) ? n : PASSO_DEFAULT;
}

// Ordem de exibição na UI (semana começando na segunda, domingo por último)
export const DIAS_SEMANA: { dow: number; nome: string; curto: string }[] = [
  { dow: 1, nome: "Segunda", curto: "Seg" },
  { dow: 2, nome: "Terça", curto: "Ter" },
  { dow: 3, nome: "Quarta", curto: "Qua" },
  { dow: 4, nome: "Quinta", curto: "Qui" },
  { dow: 5, nome: "Sexta", curto: "Sex" },
  { dow: 6, nome: "Sábado", curto: "Sáb" },
  { dow: 0, nome: "Domingo", curto: "Dom" },
];

// Defaults equivalentes ao antigo HORARIO_FUNCIONAMENTO (dom fechado).
export const GRADE_DEFAULT: GradeConfig = {
  0: { ativo: false, inicio: "09:00", fim: "18:00", almocoInicio: null, almocoFim: null },
  1: { ativo: true, inicio: "09:00", fim: "19:00", almocoInicio: null, almocoFim: null },
  2: { ativo: true, inicio: "09:00", fim: "19:00", almocoInicio: null, almocoFim: null },
  3: { ativo: true, inicio: "09:00", fim: "19:00", almocoInicio: null, almocoFim: null },
  4: { ativo: true, inicio: "09:00", fim: "19:00", almocoInicio: null, almocoFim: null },
  5: { ativo: true, inicio: "09:00", fim: "19:00", almocoInicio: null, almocoFim: null },
  6: { ativo: true, inicio: "09:00", fim: "18:00", almocoInicio: null, almocoFim: null },
};

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fmt(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}

/** Gera os slots do dia no passo indicado (default 30 min), excluindo o almoço. */
export function gerarSlotsDia(dia: DiaGrade | undefined | null, passoMin: number = PASSO_DEFAULT): string[] {
  if (!dia || !dia.ativo) return [];
  const passo = passoMin > 0 ? passoMin : PASSO_DEFAULT;
  const inicio = toMin(dia.inicio);
  const fim = toMin(dia.fim);
  const almI = dia.almocoInicio ? toMin(dia.almocoInicio) : null;
  const almF = dia.almocoFim ? toMin(dia.almocoFim) : null;
  const temAlmoco = almI !== null && almF !== null && almF > almI;

  const slots: string[] = [];
  let cur = inicio;
  // um slot só é válido se cabe pelo menos um passo antes do fechamento
  while (cur + passo <= fim) {
    const noAlmoco = temAlmoco && cur >= almI! && cur < almF!;
    if (!noAlmoco) slots.push(fmt(cur));
    cur += passo;
  }
  return slots;
}

/** Mescla uma config parcial (vinda do banco) com o default — garante os 7 dias. */
export function mesclarGrade(parcial?: Partial<Record<number, Partial<DiaGrade>>> | null): GradeConfig {
  const out = {} as GradeConfig;
  for (let d = 0; d <= 6; d++) {
    out[d] = { ...GRADE_DEFAULT[d], ...(parcial?.[d] ?? {}) };
  }
  return out;
}

/**
 * Dado o horário de início ("09:00") e a duração em minutos de um agendamento,
 * retorna TODOS os slots (no passo indicado) que ele ocupa.
 * Ex: início 09:00, dur 45, passo 15 → ["09:00","09:15","09:30"].
 * Se duracaoMin não vier (agendamentos antigos), ocupa apenas o slot de início.
 */
export function slotsOcupadosPorAgendamento(inicio: string, duracaoMin: number | undefined, passoMin: number = PASSO_DEFAULT): string[] {
  const passo = passoMin > 0 ? passoMin : PASSO_DEFAULT;
  const ini = toMin(inicio);
  if (Number.isNaN(ini)) return [];
  const dur = duracaoMin && duracaoMin > 0 ? duracaoMin : passo; // sem duração → 1 slot
  const out: string[] = [];
  for (let t = ini; t < ini + dur; t += passo) out.push(fmt(t));
  return out;
}

/** Gera os slots de uma data (YYYY-MM-DD) conforme a grade e o passo configurados. */
export function gerarSlotsData(dateKey: string, grade: GradeConfig, passoMin: number = PASSO_DEFAULT): string[] {
  const dow = new Date(dateKey + "T12:00:00").getDay();
  return gerarSlotsDia(grade[dow], passoMin);
}
