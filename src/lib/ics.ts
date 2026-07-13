// Geração de arquivo .ics (iCalendar, RFC 5545) para o cliente adicionar o
// agendamento à agenda dele (Outlook, Google Agenda, Apple Agenda, etc.).
//
// Decisão importante de fuso: o horário do agendamento é local do Brasil
// ("14:30" em tal dia). Para o evento cair no horário CERTO em qualquer
// dispositivo — independentemente do fuso do celular do cliente — escrevemos
// o DTSTART/DTEND com TZID=America/Sao_Paulo e embutimos a definição da
// timezone (bloco VTIMEZONE) no próprio arquivo. Assim não dependemos de o
// app do cliente conhecer o fuso nem de conversão para UTC no navegador.

export interface EventoAgenda {
  titulo: string;
  descricao?: string;
  local?: string;
  /** data no formato "YYYY-MM-DD" (dia local do Brasil) */
  data: string;
  /** horário no formato "HH:MM" (24h, local do Brasil) */
  horario: string;
  /** duração em minutos; default 30 se ausente/zero */
  duracaoMin?: number;
}

// Bloco VTIMEZONE fixo para America/Sao_Paulo. O Brasil não tem mais horário
// de verão desde 2019, então uma única regra de offset (-03:00) cobre os
// agendamentos. Mantido estático de propósito — sem DST, não há transições.
const VTIMEZONE_SAO_PAULO = [
  "BEGIN:VTIMEZONE",
  "TZID:America/Sao_Paulo",
  "BEGIN:STANDARD",
  "DTSTART:19700101T000000",
  "TZOFFSETFROM:-0300",
  "TZOFFSETTO:-0300",
  "TZNAME:-03",
  "END:STANDARD",
  "END:VTIMEZONE",
];

// "YYYY-MM-DD" + "HH:MM" → "YYYYMMDDTHHMMSS" (formato local do iCalendar).
function toIcsLocal(data: string, horario: string): string {
  const [ano, mes, dia] = data.split("-");
  const [h, min] = horario.split(":");
  return `${ano}${mes}${dia}T${h.padStart(2, "0")}${min.padStart(2, "0")}00`;
}

// Soma minutos a um "YYYY-MM-DD"/"HH:MM" e devolve o carimbo local do fim.
// Usa Date apenas para a aritmética de calendário (virada de hora/dia); os
// componentes são lidos de volta em UTC para não reintroduzir fuso.
function fimIcsLocal(data: string, horario: string, duracaoMin: number): string {
  const [ano, mes, dia] = data.split("-").map(Number);
  const [h, min] = horario.split(":").map(Number);
  const base = Date.UTC(ano, mes - 1, dia, h, min);
  const fim = new Date(base + duracaoMin * 60_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${fim.getUTCFullYear()}${p(fim.getUTCMonth() + 1)}${p(fim.getUTCDate())}T${p(fim.getUTCHours())}${p(fim.getUTCMinutes())}00`;
}

// Escapa vírgula, ponto-e-vírgula, barra e quebra de linha conforme o RFC.
function esc(v: string): string {
  return v
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Timestamp UTC "agora" no formato do iCalendar (para DTSTAMP).
function nowUtcStamp(): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const d = new Date();
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

export function gerarICS(ev: EventoAgenda): string {
  const duracao = ev.duracaoMin && ev.duracaoMin > 0 ? ev.duracaoMin : 30;
  const inicio = toIcsLocal(ev.data, ev.horario);
  const fim = fimIcsLocal(ev.data, ev.horario, duracao);
  // uid único e estável o bastante para este evento
  const uid = `${ev.data}-${ev.horario.replace(":", "")}-${Math.random().toString(36).slice(2, 8)}@ortegabarber`;

  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ortega Barber//Agendamento//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...VTIMEZONE_SAO_PAULO,
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${nowUtcStamp()}`,
    `DTSTART;TZID=America/Sao_Paulo:${inicio}`,
    `DTEND;TZID=America/Sao_Paulo:${fim}`,
    `SUMMARY:${esc(ev.titulo)}`,
    ...(ev.descricao ? [`DESCRIPTION:${esc(ev.descricao)}`] : []),
    ...(ev.local ? [`LOCATION:${esc(ev.local)}`] : []),
    // lembrete 1h antes
    "BEGIN:VALARM",
    "TRIGGER:-PT1H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(ev.titulo)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  // O RFC pede CRLF entre as linhas.
  return linhas.join("\r\n");
}

// Gera o .ics e dispara o download no navegador. Nome do arquivo amigável.
export function baixarICS(ev: EventoAgenda, nomeArquivo = "agendamento-ortega.ics"): void {
  const conteudo = gerarICS(ev);
  const blob = new Blob([conteudo], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // libera o objeto após o clique
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
