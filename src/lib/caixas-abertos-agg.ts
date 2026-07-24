import "server-only";
import { getAdminDb } from "./firebase-admin";

/**
 * AGREGADOR de "caixas retroativos abertos".
 *
 * Um dia está "aberto" quando tem COMANDA FINALIZADA (faturamento real) sem
 * FECHAMENTO de caixa. O painel admin (useAdminNotificacoes → /api/admin/notificacoes)
 * precisa desse número a cada polling.
 *
 * ANTES: o polling lia até ~1000 comandas (30d) + 100 fechamentos A CADA 90s por aba
 * aberta, só pra extrair uma lista de datas. Era o maior consumidor de cota do
 * Firestore e o que estourou o limite diário (RESOURCE_EXHAUSTED, 22/07).
 *
 * AGORA: mantemos UM doc agregador (`meta/caixasAbertos`) atualizado ON-WRITE — quando
 * uma comanda finaliza/reabre/cancela ou um fechamento é criado/excluído. O polling
 * passa a ler 1 documento em vez de ~1100. As escritas são eventos raros (dezenas/dia),
 * então o custo migra de milhares de LEITURAS/dia para poucas escrituras.
 *
 * Estrutura do doc `meta/caixasAbertos`:
 *   { dias: { "2026-07-20": { comanda: true, fechamento: false }, ... }, atualizadoEm }
 * "aberto" = comanda === true && fechamento !== true.
 */

const META_COL = "meta";
const META_DOC = "caixasAbertos";

// O painel só olha ~30 dias; guardamos 90 pra ter margem e podamos o resto.
// Sem isso o mapa `dias` cresceria pra sempre e um dia estouraria o teto de
// 1 MiB por documento do Firestore, congelando o agregador silenciosamente.
const RETENCAO_DIAS = 90;

interface DiaFlags {
  comanda?: boolean;    // tem ao menos 1 comanda finalizada no dia
  fechamento?: boolean; // tem fechamento de caixa no dia
}
interface AggDoc {
  dias?: Record<string, DiaFlags>;
  atualizadoEm?: number;
}

/** Data-corte (YYYY-MM-DD) de RETENCAO_DIAS atrás — entradas mais velhas são podadas. */
function dataCorteRetencao(): string {
  const d = new Date();
  d.setDate(d.getDate() - RETENCAO_DIAS);
  return d.toISOString().split("T")[0];
}

/**
 * Lê o agregador e devolve a lista de datas com caixa aberto (comanda finalizada
 * sem fechamento), mais recente primeiro. Custo: 1 leitura.
 *
 * Só considera dias ANTERIORES a `hoje` (o dia corrente ainda está em operação e
 * não conta como "caixa retroativo esquecido"). Aplica corte de `limiteInferior`
 * (ex.: 30 dias atrás) pra não crescer indefinidamente.
 */
export async function lerCaixasAbertos(
  hoje: string,
  limiteInferior: string,
): Promise<string[]> {
  const db = getAdminDb();
  const snap = await db.collection(META_COL).doc(META_DOC).get();
  const agg = (snap.data() as AggDoc | undefined) ?? {};
  const dias = agg.dias ?? {};
  return Object.entries(dias)
    .filter(([data, f]) => f.comanda === true && f.fechamento !== true && data >= limiteInferior && data < hoje)
    .map(([data]) => data)
    .sort()
    .reverse();
}

/**
 * Aplica uma mudança no mapa de dias e reescreve o agregador já PODADO (remove
 * entradas mais antigas que RETENCAO_DIAS). Lê o doc, aplica `mutacao`, reescreve.
 *
 * Custo: 1 leitura + 1 escrita por evento — e eventos (finalizar comanda, fechar
 * caixa) são raros (dezenas/dia), então é irrelevante perto do que economizamos no
 * polling. Reescrever o mapa inteiro (em vez de merge) é o que permite PODAR: um
 * `set({merge:true})` só adiciona chaves, nunca remove.
 *
 * Nunca lança pra fora — o agregador é derivado; se falhar, o próximo evento
 * conserta e o `seed` pode reconstruir tudo.
 */
async function mutarAgregador(mutacao: (dias: Record<string, DiaFlags>) => void): Promise<void> {
  try {
    const db = getAdminDb();
    const ref = db.collection(META_COL).doc(META_DOC);
    const snap = await ref.get();
    const dias = ((snap.data() as AggDoc | undefined)?.dias) ?? {};

    mutacao(dias);

    // Poda entradas fora da janela de retenção pra o doc não crescer sem limite.
    const corte = dataCorteRetencao();
    const podado: Record<string, DiaFlags> = {};
    for (const [data, flags] of Object.entries(dias)) {
      if (data >= corte) podado[data] = flags;
    }

    await ref.set({ dias: podado, atualizadoEm: Date.now() });
  } catch {
    // agregador é best-effort; não bloqueia a operação de negócio
  }
}

/** Marca uma flag de um dia no agregador (idempotente). */
async function setFlag(data: string, flag: keyof DiaFlags, valor: boolean): Promise<void> {
  if (!data) return;
  await mutarAgregador((dias) => {
    dias[data] = { ...(dias[data] ?? {}), [flag]: valor };
  });
}

/** Comanda finalizada num dia → passa a existir faturamento real naquela data. */
export async function marcarComandaFinalizada(data: string): Promise<void> {
  await setFlag(data, "comanda", true);
}

/** Fechamento criado para um dia. */
export async function marcarFechamentoCriado(data: string): Promise<void> {
  await setFlag(data, "fechamento", true);
}

/** Fechamento excluído → o dia pode voltar a ficar "aberto" se ainda houver comanda. */
export async function marcarFechamentoExcluido(data: string): Promise<void> {
  await setFlag(data, "fechamento", false);
}

/**
 * Reconcilia UM dia consultando a fonte real (poucos docs: só as comandas/fechamentos
 * DAQUELE dia, não 30 dias). Usado quando uma comanda é reaberta/cancelada, pois aí
 * o dia pode ter deixado de ter qualquer comanda finalizada e a flag `comanda`
 * precisa cair. Custo: leituras só do dia (tipicamente <20), e apenas nesses eventos
 * raros — nunca no polling.
 */
export async function reconciliarDia(data: string): Promise<void> {
  if (!data) return;
  try {
    const db = getAdminDb();
    const [comandasSnap, fechSnap] = await Promise.all([
      db.collection("comandas").where("data", "==", data).where("status", "==", "finalizada").limit(1).get(),
      db.collection("fechamentos").where("data", "==", data).limit(1).get(),
    ]);
    await mutarAgregador((dias) => {
      dias[data] = { comanda: !comandasSnap.empty, fechamento: !fechSnap.empty };
    });
  } catch {
    // best-effort
  }
}
