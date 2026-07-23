// SEED one-off do agregador `meta/caixasAbertos`.
//
// Popula o doc agregador a partir do estado ATUAL das coleções `comandas` e
// `fechamentos` (últimos 30 dias). Necessário rodar UMA vez após introduzir o
// agregador, senão o painel mostra "0 caixas abertos" até que novos eventos
// (finalizar comanda / fechar caixa) preencham o doc.
//
// Idempotente: pode rodar quantas vezes quiser — sempre reescreve o retrato atual.
//
// USO:
//   DOTENV_PATH=.env.local node scripts/seed-caixas-abertos-agg.mjs           → DRY-RUN
//   DOTENV_PATH=.env.local node scripts/seed-caixas-abertos-agg.mjs --write   → ESCREVE
//   (produção: DOTENV_PATH=.env.ortega-0907 ... --write)
//   Emulador: exporte FIRESTORE_EMULATOR_HOST=localhost:8080 antes.
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

const USE_EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST;
const WRITE = process.argv.includes("--write");

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
      if (!valor.endsWith(aspa)) { const buf = [valor]; while (++i < linhas.length) { const p = linhas[i]; if (p.endsWith(aspa)) { buf.push(p.slice(0, -1)); break; } buf.push(p); } valor = buf.join("\n"); }
      else valor = valor.slice(0, -1);
    } else valor = valor.trim();
    if (!(chave in process.env)) process.env[chave] = valor;
  }
}

if (USE_EMULATOR) {
  if (!getApps().length) initializeApp({ projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "demo-ortega" });
} else {
  carregarEnv(process.env.DOTENV_PATH || ".env.local");
  const parsePK = (r) => r ? r.replace(/\\n/g, "\n").replace(/\\\\n/g, "\n") : undefined;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  if (!projectId) { console.error("❌ FIREBASE_ADMIN_PROJECT_ID ausente. Carregue o .env certo (DOTENV_PATH)."); process.exit(1); }
  if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: parsePK(process.env.FIREBASE_ADMIN_PRIVATE_KEY) }) });
}
const db = getFirestore();

const hojeKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

async function main() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || "demo-ortega";
  const hoje = hojeKey();
  const l30 = new Date(); l30.setDate(l30.getDate() - 30);
  const limite30 = l30.toISOString().split("T")[0];

  console.log("─".repeat(70));
  console.log(`SEED meta/caixasAbertos  —  ${WRITE ? "⚠️  ESCRITA" : "🔍 DRY-RUN"}`);
  console.log(`Alvo: ${USE_EMULATOR ? "EMULADOR" : "projeto " + projectId} | janela: ${limite30} .. ${hoje}`);
  console.log("─".repeat(70));

  const [comandasSnap, fechSnap] = await Promise.all([
    db.collection("comandas").where("data", ">=", limite30).where("data", "<", hoje).get(),
    db.collection("fechamentos").where("data", ">=", limite30).where("data", "<", hoje).get(),
  ]);

  const dias = {};
  comandasSnap.docs.forEach((doc) => {
    const c = doc.data();
    if (c.status === "finalizada" && c.data) {
      dias[c.data] = { ...(dias[c.data] || {}), comanda: true };
    }
  });
  fechSnap.docs.forEach((doc) => {
    const f = doc.data();
    if (f.data) dias[f.data] = { ...(dias[f.data] || {}), fechamento: true };
  });

  const abertos = Object.entries(dias)
    .filter(([, f]) => f.comanda === true && f.fechamento !== true)
    .map(([d]) => d).sort().reverse();

  console.log(`Comandas lidas: ${comandasSnap.size} | Fechamentos lidos: ${fechSnap.size}`);
  console.log(`Dias mapeados: ${Object.keys(dias).length}`);
  console.log(`Caixas ABERTOS (comanda finalizada sem fechamento): ${abertos.length}`);
  if (abertos.length) console.log("  → " + abertos.join(", "));

  if (!WRITE) {
    console.log("\n🔍 DRY-RUN — nada gravado. Rode com --write para persistir.");
    return;
  }
  // set SEM merge: o seed é um retrato limpo do estado atual (substitui o mapa
  // inteiro), então rodar de novo nunca deixa lixo de execuções anteriores.
  await db.collection("meta").doc("caixasAbertos").set({ dias, atualizadoEm: Date.now() });
  console.log("\n✅ Agregador gravado em meta/caixasAbertos.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
