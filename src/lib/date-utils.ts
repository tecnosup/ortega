// Data de "hoje" no fuso do Brasil — evita o bug de servidores em UTC
// (Vercel) rolarem para o dia seguinte a partir das 21h no horário local.
export function hojeBR(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
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
