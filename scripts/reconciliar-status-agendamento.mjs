// RECONCILIAÇÃO one-off: alinha o STATUS do AGENDAMENTO ao status da COMANDA vinculada.
//
// Conserta os casos que ficaram DEFASADOS antes do fix de sync reverso — ex.: comanda
// finalizada (pelo backfill ou pelo Caixa) mas agendamento ainda "confirmado" (o Pedro).
//
// Regra de alinhamento (comanda → agendamento) — MODO SEGURO, só finalização:
//   comanda finalizada  → agendamento concluido
//   comanda cancelada   → NÃO mexe (ambíguo: pode ter tido refação avulsa paga,
//                          ex.: Pedro 08/07). Cancelamento é sempre MANUAL.
//   comanda aberta      → NÃO mexe (o agendamento manda enquanto está aberta)
// Só grava quando há DIVERGÊNCIA real. NUNCA toca em comanda, nem em fechamentos.
//
// USO:
//   node scripts/reconciliar-status-agendamento.mjs                    → DRY-RUN de HOJE
//   node scripts/reconciliar-status-agendamento.mjs --data=2026-07-08  → dry-run de uma data
//   node scripts/reconciliar-status-agendamento.mjs --data=2026-07-08 --write  → ESCREVE
//   node scripts/reconciliar-status-agendamento.mjs --all              → todas as datas (dry-run)
//
// Emulador: exporte FIRESTORE_EMULATOR_HOST=localhost:8080 antes (usa projeto demo-ortega).
// Produção: carregue DOTENV_PATH=.env.ortega-0907 (credencial admin real).
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

const USE_EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;

function carregarEnv(path) {
  const txt = readFileSync(path, "utf8").replace(/\r\n/g, "\n");
  const linhas = txt.split("\n");
  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i]; const t = l.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = l.indexOf("="); if (eq === -1) continue;
    const chave = l.slice(0, eq).trim(); let valor = l.slice(eq + 1);
    const aspa = valor.trim().startsWith('"') ? '"' : valor.trim().startsWith("'") ? "'" : null;
    if (aspa) { valor = valor.trim().slice(1);
      if (!valor.endsWith(aspa)) { const buf=[valor]; while(++i<linhas.length){const p=linhas[i]; if(p.endsWith(aspa)){buf.push(p.slice(0,-1));break;} buf.push(p);} valor=buf.join("\n"); }
      else valor = valor.slice(0,-1);
    } else valor = valor.trim();
    if (!(chave in process.env)) process.env[chave] = valor;
  }
}

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const ALL = args.includes("--all");
const dataArg = args.find((a) => a.startsWith("--data="))?.split("=")[1];
const hojeKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const DATA_ALVO = dataArg || (ALL ? null : hojeKey());

if (USE_EMULATOR) {
  if (!getApps().length) initializeApp({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "demo-ortega" });
} else {
  carregarEnv(process.env.DOTENV_PATH || ".env.local");
  const parsePK = (r) => r ? r.replace(/\\n/g,"\n").replace(/\\\\n/g,"\n") : undefined;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  if (!projectId) { console.error("❌ FIREBASE_ADMIN_PROJECT_ID ausente. Carregue o .env certo (DOTENV_PATH)."); process.exit(1); }
  if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: parsePK(process.env.FIREBASE_ADMIN_PRIVATE_KEY) }) });
}
const db = getFirestore();

// status da comanda → status esperado do agendamento.
// MODO SEGURO: só sincroniza FINALIZAÇÃO. Comanda cancelada NÃO cancela o
// agendamento automaticamente — é caso ambíguo (pode ter havido refação avulsa
// paga, ex.: Pedro 08/07). Cancelamento é sempre decisão MANUAL.
function statusEsperado(statusComanda) {
  if (statusComanda === "finalizada") return "concluido";
  return null; // cancelada/aberta → não mexe
}

async function main() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || "demo-ortega";
  console.log("─".repeat(70));
  console.log(`RECONCILIAÇÃO status agendamento  —  ${WRITE ? "⚠️  ESCRITA" : "🔍 DRY-RUN"}`);
  console.log(`Alvo: ${USE_EMULATOR ? "EMULADOR" : "projeto " + projectId} | escopo: ${DATA_ALVO || "TODAS as datas"}`);
  console.log("─".repeat(70));

  // 1) comandas no escopo (fonte da verdade do status)
  let cq = db.collection("comandas");
  if (DATA_ALVO) cq = cq.where("data", "==", DATA_ALVO);
  const cSnap = await cq.get();
  let leituras = cSnap.size || 1;

  // 2) mapeia agendamentoId → status esperado (só comandas vinculadas finalizadas/canceladas)
  const esperadoPorAg = new Map();
  for (const d of cSnap.docs) {
    const c = d.data();
    if (!c.agendamentoId) continue;
    const esp = statusEsperado(c.status);
    if (esp) esperadoPorAg.set(c.agendamentoId, esp);
  }

  // 3) checa cada agendamento vinculado e detecta divergência
  const divergentes = [];
  for (const [agId, esperado] of esperadoPorAg) {
    const agDoc = await db.collection("agendamentos").doc(agId).get();
    leituras++;
    if (!agDoc.exists) continue;
    const atual = agDoc.data().status;
    if (atual !== esperado) divergentes.push({ agId, nome: agDoc.data().nome, data: agDoc.data().data, horario: agDoc.data().horario, de: atual, para: esperado });
  }

  console.log(`\n📊 Comandas lidas: ${cSnap.size} | agendamentos vinculados checados: ${esperadoPorAg.size}`);
  console.log(`   ➜ Divergências encontradas: ${divergentes.length}\n`);
  for (const d of divergentes) {
    console.log(`   • ${d.data} ${d.horario}  ${d.nome}:  ${d.de}  →  ${d.para}   (${d.agId})`);
  }

  if (WRITE && divergentes.length > 0) {
    console.log(`\n✍️  Escrevendo ${divergentes.length} correção(ões)...`);
    const now = Date.now();
    for (let i = 0; i < divergentes.length; i += 400) {
      const lote = divergentes.slice(i, i + 400);
      const batch = db.batch();
      for (const d of lote) batch.update(db.collection("agendamentos").doc(d.agId), { status: d.para, atualizadoEm: now });
      await batch.commit();
    }
    console.log(`✅ ${divergentes.length} agendamento(s) sincronizado(s).`);
  } else if (!WRITE) {
    console.log(`\n🔍 DRY-RUN — nada escrito. Pra aplicar: adicione --write`);
  }
  console.log(`\n📈 Leituras nesta execução: ~${leituras}`);
  console.log("─".repeat(70));
}
main().then(() => process.exit(0)).catch((e) => { console.error("ERRO:", e); process.exit(1); });
