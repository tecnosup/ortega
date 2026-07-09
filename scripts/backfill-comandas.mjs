// ─────────────────────────────────────────────────────────────────────────────
// BACKFILL DE COMANDAS (one-off, SEGURO e IDEMPOTENTE)
//
// Problema: o Caixa lê `comandas`. Comanda só nasce ao criar agendamento NOVO
// (após o deploy do módulo). Agendamentos feitos ANTES do deploy ficaram sem
// comanda → não aparecem no Caixa. Este script cria as comandas que faltaram.
//
// NUNCA altera/apaga `agendamentos` — só ADICIONA em `comandas`.
// Espelha o mapeamento de src/app/api/agendamentos/route.ts (criarComanda).
//
// USO:
//   node scripts/backfill-comandas.mjs                 → DRY-RUN de HOJE (não escreve)
//   node scripts/backfill-comandas.mjs --data=2026-07-08   → dry-run de uma data
//   node scripts/backfill-comandas.mjs --write         → ESCREVE (só após aprovar o dry-run)
//   node scripts/backfill-comandas.mjs --all            → todas as datas (dry-run) — CUIDADO
//
// Requer: variáveis FIREBASE_ADMIN_* no ambiente (carregar o .env certo antes).
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

// ── carrega .env indicado por DOTENV_PATH (ou .env.local) SEM dependência externa ──
// Trata valores multi-linha entre aspas (ex: FIREBASE_ADMIN_PRIVATE_KEY que quebra
// em várias linhas físicas até fechar a aspa).
function carregarEnv(path) {
  try {
    const txt = readFileSync(path, "utf8").replace(/\r\n/g, "\n");
    const linhas = txt.split("\n");
    for (let i = 0; i < linhas.length; i++) {
      const l = linhas[i];
      const t = l.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = l.indexOf("=");
      if (eq === -1) continue;
      const chave = l.slice(0, eq).trim();
      let valor = l.slice(eq + 1);
      const aspa = valor.trim().startsWith('"') ? '"' : valor.trim().startsWith("'") ? "'" : null;
      if (aspa) {
        valor = valor.trim().slice(1); // tira a aspa de abertura
        // se não fecha nesta linha, acumula as próximas até fechar a aspa
        if (!valor.endsWith(aspa)) {
          const buf = [valor];
          while (++i < linhas.length) {
            const prox = linhas[i];
            if (prox.endsWith(aspa)) { buf.push(prox.slice(0, -1)); break; }
            buf.push(prox);
          }
          valor = buf.join("\n");
        } else {
          valor = valor.slice(0, -1); // tira a aspa de fechamento
        }
      } else {
        valor = valor.trim();
      }
      if (!(chave in process.env)) process.env[chave] = valor;
    }
  } catch (e) {
    console.error(`Não consegui ler o env em ${path}:`, e.message);
    process.exit(1);
  }
}

const ENV_PATH = process.env.DOTENV_PATH || ".env.local";
carregarEnv(ENV_PATH);

// ── args ──
const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const ALL = args.includes("--all");
const dataArg = args.find((a) => a.startsWith("--data="))?.split("=")[1];
function hojeKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const DATA_ALVO = dataArg || (ALL ? null : hojeKey());

// ── init admin (mesmas credenciais do projeto) ──
function parsePrivateKey(raw) {
  if (!raw) return undefined;
  return raw.replace(/\\n/g, "\n").replace(/\\\\n/g, "\n");
}
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
if (!projectId) {
  console.error("❌ FIREBASE_ADMIN_PROJECT_ID ausente. Carregue o .env certo (DOTENV_PATH).");
  process.exit(1);
}
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: parsePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
    }),
  });
}
const db = getFirestore();

// ── contador de leituras (transparência de cota) ──
let LEITURAS = 0;

// espelha parsePriceNum do projeto
function parsePriceNum(preco) {
  if (typeof preco === "number") return preco;
  return parseFloat(String(preco ?? "").replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
}

// status do agendamento → status da comanda (regra do prompt)
//   concluido → finalizada | cancelado → PULAR | resto → aberta
function statusComanda(statusAg) {
  if (statusAg === "concluido") return "finalizada";
  if (statusAg === "cancelado") return null; // pular
  return "aberta";
}

function limpar(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

async function main() {
  console.log("─".repeat(70));
  console.log(`BACKFILL DE COMANDAS  —  modo: ${WRITE ? "⚠️  ESCRITA" : "🔍 DRY-RUN (não escreve)"}`);
  console.log(`Firebase projectId ATIVO: ${projectId}`);
  console.log(`Escopo: ${DATA_ALVO ? `data = ${DATA_ALVO}` : "TODAS as datas (--all)"}`);
  console.log("─".repeat(70));

  // 1) agendamentos no escopo
  let q = db.collection("agendamentos");
  if (DATA_ALVO) q = q.where("data", "==", DATA_ALVO);
  const agSnap = await q.get();
  LEITURAS += agSnap.size || 1;
  const ags = agSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // 2) comandas existentes (pra idempotência) — 1 query por data (barato)
  const jaTemComanda = new Set();
  if (DATA_ALVO) {
    const cSnap = await db.collection("comandas").where("data", "==", DATA_ALVO).get();
    LEITURAS += cSnap.size || 1;
    cSnap.docs.forEach((d) => { const aId = d.data().agendamentoId; if (aId) jaTemComanda.add(aId); });
  } else {
    const cSnap = await db.collection("comandas").get();
    LEITURAS += cSnap.size || 1;
    cSnap.docs.forEach((d) => { const aId = d.data().agendamentoId; if (aId) jaTemComanda.add(aId); });
  }

  // 3) decide o que criar
  const criar = [];
  const pulados = { cancelado: 0, jaTemComanda: 0 };
  for (const a of ags) {
    if (jaTemComanda.has(a.id)) { pulados.jaTemComanda++; continue; }
    const st = statusComanda(a.status);
    if (st === null) { pulados.cancelado++; continue; }
    criar.push({ ag: a, statusComanda: st });
  }

  // agrupa por dia pro relatório
  const porDia = {};
  for (const c of criar) {
    porDia[c.ag.data] = porDia[c.ag.data] || { total: 0, aberta: 0, finalizada: 0 };
    porDia[c.ag.data].total++;
    porDia[c.ag.data][c.statusComanda]++;
  }

  console.log(`\n📊 Agendamentos lidos: ${ags.length}`);
  console.log(`   Já tinham comanda (pulados):   ${pulados.jaTemComanda}`);
  console.log(`   Cancelados (pulados):          ${pulados.cancelado}`);
  console.log(`   ➜ Comandas a CRIAR:            ${criar.length}\n`);
  if (criar.length > 0) {
    console.log("   Por dia:");
    for (const [dia, r] of Object.entries(porDia).sort()) {
      console.log(`     ${dia}:  ${r.total}  (aberta: ${r.aberta}, finalizada: ${r.finalizada})`);
    }
  }

  // 4) escreve (só com --write)
  if (WRITE && criar.length > 0) {
    console.log(`\n✍️  Escrevendo ${criar.length} comanda(s) em batches de 400...`);
    const now = Date.now();
    let escritas = 0;
    for (let i = 0; i < criar.length; i += 400) {
      const lote = criar.slice(i, i + 400);
      const batch = db.batch();
      for (const { ag, statusComanda: st } of lote) {
        const ref = db.collection("comandas").doc(); // id novo
        const doc = limpar({
          origem: "agendamento",
          status: st,
          agendamentoId: ag.id,
          clienteNome: ag.nome,
          clienteTelefone: ag.telefone,
          data: ag.data,
          horario: ag.horario,
          barbeiroId: ag.barbeiroId,
          barbeiroNome: ag.barbeiroNome,
          itens: [{ id: "1", tipo: "servico", descricao: ag.servico, valor: parsePriceNum(ag.preco) }],
          total: parsePriceNum(ag.preco),
          cupom: ag.cupom,
          desconto: ag.desconto,
          assinaturaId: ag.assinaturaId,
          cobertoPorAssinatura: ag.cobertoPorAssinatura,
          criadoEm: now,
          atualizadoEm: now,
          ...(st === "finalizada" ? { finalizadoEm: now } : {}),
        });
        batch.set(ref, doc);
      }
      await batch.commit();
      escritas += lote.length;
      console.log(`   lote ${Math.floor(i / 400) + 1}: +${lote.length} (total ${escritas})`);
    }
    console.log(`\n✅ ${escritas} comanda(s) criada(s).`);
  } else if (!WRITE) {
    console.log(`\n🔍 DRY-RUN — nada foi escrito. Pra criar de verdade: adicione --write`);
  }

  console.log(`\n📈 Leituras no Firestore nesta execução: ~${LEITURAS} (cota diária: 50.000)`);
  console.log("─".repeat(70));
}

main().then(() => process.exit(0)).catch((e) => { console.error("ERRO:", e); process.exit(1); });
