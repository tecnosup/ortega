// BACKFILL one-off do contador `meta/clientesAtendidos` + índice `clientes_index`.
//
// Reconstrói o número de CLIENTES DISTINTOS (telefones únicos) a partir do
// histórico de `agendamentos` com status "concluido". Necessário rodar UMA vez
// depois de introduzir o contador — senão a landing começa do zero e ignora todo
// o histórico que o Igor já tem.
//
// Esta é a ÚNICA vez que a coleção inteira é varrida: no dia a dia o contador é
// mantido on-write (src/lib/clientes-agg.ts) e a landing lê 1 documento.
//
// Idempotente: pode rodar quantas vezes quiser — recalcula o retrato atual e
// reescreve o total (não soma em cima).
//
// USO:
//   DOTENV_PATH=.env.local node scripts/backfill-clientes-agg.mjs           → DRY-RUN
//   DOTENV_PATH=.env.local node scripts/backfill-clientes-agg.mjs --write   → ESCREVE
//   (produção: DOTENV_PATH=.env.ortega-0907 ... --write)
//   Emulador: exporte FIRESTORE_EMULATOR_HOST=localhost:8080 antes.
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

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

// Mesma normalização E MESMO HASH de src/lib/clientes-agg.ts — se divergir, o
// backfill cria ids diferentes do runtime e o mesmo cliente conta duas vezes.
function normalizarTelefone(telefone) {
  let d = (telefone || "").replace(/\D/g, "");
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  return d;
}
function idIndice(telefoneNormalizado) {
  return createHash("sha256").update(telefoneNormalizado).digest("hex").slice(0, 32);
}

async function main() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || "demo-ortega";

  console.log("─".repeat(70));
  console.log(`BACKFILL meta/clientesAtendidos  —  ${WRITE ? "⚠️  ESCRITA" : "🔍 DRY-RUN"}`);
  console.log(`Alvo: ${USE_EMULATOR ? "EMULADOR" : "projeto " + projectId}`);
  console.log("─".repeat(70));

  const snap = await db.collection("agendamentos").where("status", "==", "concluido").get();

  const telefones = new Set();
  let semTelefone = 0;
  snap.docs.forEach((doc) => {
    const tel = normalizarTelefone(doc.data().telefone);
    if (tel.length < 8) { semTelefone++; return; }
    telefones.add(tel);
  });

  console.log(`Agendamentos concluídos lidos: ${snap.size}`);
  console.log(`Sem telefone válido (ignorados): ${semTelefone}`);
  console.log(`CLIENTES DISTINTOS: ${telefones.size}`);

  if (!WRITE) {
    console.log("\n🔍 DRY-RUN — nada gravado. Rode com --write para persistir.");
    return;
  }

  // Índice: 1 doc por telefone, em lotes de 400 (teto do batch é 500).
  const lista = [...telefones];
  for (let i = 0; i < lista.length; i += 400) {
    const batch = db.batch();
    for (const tel of lista.slice(i, i + 400)) {
      batch.set(db.collection("clientes_index").doc(idIndice(tel)), { primeiroEm: Date.now() }, { merge: true });
    }
    await batch.commit();
    console.log(`  índice: ${Math.min(i + 400, lista.length)}/${lista.length}`);
  }

  // Total absoluto (set, não increment): rodar de novo não duplica.
  await db.collection("meta").doc("clientesAtendidos").set({ total: telefones.size, atualizadoEm: Date.now() });
  console.log(`\n✅ Contador gravado: ${telefones.size} clientes.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
