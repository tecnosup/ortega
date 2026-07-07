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

/** Gera os slots de 30 min do dia, excluindo a janela de almoço. */
export function gerarSlotsDia(dia: DiaGrade | undefined | null): string[] {
  if (!dia || !dia.ativo) return [];
  const inicio = toMin(dia.inicio);
  const fim = toMin(dia.fim);
  const almI = dia.almocoInicio ? toMin(dia.almocoInicio) : null;
  const almF = dia.almocoFim ? toMin(dia.almocoFim) : null;
  const temAlmoco = almI !== null && almF !== null && almF > almI;

  const slots: string[] = [];
  let cur = inicio;
  while (cur + 30 <= fim) {
    const noAlmoco = temAlmoco && cur >= almI! && cur < almF!;
    if (!noAlmoco) slots.push(fmt(cur));
    cur += 30;
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

/** Gera os slots de uma data (YYYY-MM-DD) conforme a grade configurada. */
export function gerarSlotsData(dateKey: string, grade: GradeConfig): string[] {
  const dow = new Date(dateKey + "T12:00:00").getDay();
  return gerarSlotsDia(grade[dow]);
}
