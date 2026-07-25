// Data de "hoje" no fuso do Brasil — evita o bug de servidores em UTC
// (Vercel) rolarem para o dia seguinte a partir das 21h no horário local.
export function hojeBR(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

/**
 * Data de N dias atrás (YYYY-MM-DD) no fuso do Brasil.
 * Usada pra montar a janela das queries do Firestore — assim as telas admin
 * leem só o período que exibem em vez da coleção inteira. Ancorada em hojeBR()
 * pelo mesmo motivo dele existir: servidor em UTC não pode adiantar o dia.
 */
export function diasAtras(n: number): string {
  const [y, m, d] = hojeBR().split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() - n);
  return base.toISOString().split("T")[0];
}

/** Data de N dias à frente (YYYY-MM-DD) no fuso do Brasil. */
export function diasAFrente(n: number): string {
  return diasAtras(-n);
}

export function toDateKey(d: Date): string;
export function toDateKey(year: number, month: number, day: number): string;
export function toDateKey(yearOrDate: number | Date, month?: number, day?: number): string {
  let y: number, m: number, d: number;
  if (yearOrDate instanceof Date) {
    y = yearOrDate.getFullYear();
    m = yearOrDate.getMonth();
    d = yearOrDate.getDate();
  } else {
    y = yearOrDate;
    m = month!;
    d = day!;
  }
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
