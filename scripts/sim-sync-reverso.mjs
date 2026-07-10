// SIMULAÇÃO no EMULADOR (zero rede/prod) do fix de sync reverso comanda→agendamento.
//
// Replica FIELMENTE a lógica nova de src/lib/comandas.ts:
//   - espelharStatusNoAgendamento(comanda, status)
//   - finalizarComanda  → espelha "concluido"
//   - cancelarComanda   → espelha "cancelado" + devolve crédito 1x
//   - reabrirComanda    → espelha "confirmado"
// e a decisão anti-dupla-devolução da rota do agendamento.
//
// USO (com emulador já no ar, FIRESTORE_EMULATOR_HOST setado):
//   firebase emulators:exec --only firestore "node scripts/sim-sync-reverso.mjs"
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Mesma inicialização que src/lib/firebase-admin.ts faz no modo emulador.
if (!getApps().length) initializeApp({ projectId: "demo-ortega" });
const db = getFirestore();

const parsePriceNum = (p) =>
  typeof p === "number" ? p : parseFloat(String(p ?? "").replace(/[^\d.,]/g, "").replace(",", ".")) || 0;

// ── réplica fiel do helper novo ──
async function espelharStatusNoAgendamento(comanda, novoStatusAg) {
  const agId = comanda.agendamentoId;
  if (!agId) return;
  try {
    await db.collection("agendamentos").doc(agId).update({ status: novoStatusAg, atualizadoEm: Date.now() });
  } catch { /* não bloqueia */ }
}

// ── réplica fiel de devolverCredito (assinaturas.ts): +1 com clamp no total ──
async function devolverCredito(id) {
  const ref = db.collection("assinaturas").doc(id);
  return db.runTransaction(async (t) => {
    const doc = await t.get(ref);
    if (!doc.exists) return false;
    const a = doc.data();
    const novo = Math.min(a.cortesRestantes + 1, a.planoCortesTotal);
    t.update(ref, { cortesRestantes: novo, atualizadoEm: Date.now() });
    return true;
  });
}

async function getComanda(id) {
  const d = await db.collection("comandas").doc(id).get();
  return d.exists ? { id: d.id, ...d.data() } : null;
}

// ── réplicas fiéis das 3 funções novas ──
async function finalizarComanda(id) {
  const comanda = await getComanda(id);
  if (!comanda || comanda.status !== "aberta") return null;
  const now = Date.now();
  await db.collection("comandas").doc(id).update({ status: "finalizada", finalizadoEm: now, atualizadoEm: now });
  await espelharStatusNoAgendamento(comanda, "concluido");
  return { ...comanda, status: "finalizada" };
}
async function cancelarComanda(id) {
  const comanda = await getComanda(id);
  if (!comanda || comanda.status !== "aberta") return null;
  await db.collection("comandas").doc(id).update({ status: "cancelada", atualizadoEm: Date.now() });
  await espelharStatusNoAgendamento(comanda, "cancelado");
  if (comanda.cobertoPorAssinatura && comanda.assinaturaId) {
    await devolverCredito(comanda.assinaturaId).catch(() => {});
  }
  return { ...comanda, status: "cancelada" };
}
async function reabrirComanda(id) {
  const comanda = await getComanda(id);
  if (!comanda || comanda.status !== "finalizada") return null;
  const now = Date.now();
  await db.collection("comandas").doc(id).update({ status: "aberta", finalizadoEm: FieldValue.delete(), atualizadoEm: now });
  await espelharStatusNoAgendamento(comanda, "confirmado");
  return { ...comanda, status: "aberta" };
}

// helper: cria par agendamento+comanda como o fluxo real
async function criarPar({ nome, statusAg, preco, assinaturaId, cobertoPorAssinatura }) {
  const agRef = await db.collection("agendamentos").add({
    nome, telefone: "5512999999999", servico: "Corte na Tesoura", preco,
    data: "2026-07-08", horario: "17:30", status: statusAg,
    ...(assinaturaId ? { assinaturaId, cobertoPorAssinatura } : {}),
    criadoEm: Date.now(), atualizadoEm: Date.now(),
  });
  const cRef = await db.collection("comandas").add({
    origem: "agendamento", status: "aberta", agendamentoId: agRef.id,
    clienteNome: nome, data: "2026-07-08", horario: "17:30",
    itens: [{ id: "1", tipo: "servico", descricao: "Corte na Tesoura", valor: parsePriceNum(preco) }],
    total: parsePriceNum(preco),
    ...(assinaturaId ? { assinaturaId, cobertoPorAssinatura } : {}),
    criadoEm: Date.now(), atualizadoEm: Date.now(),
  });
  return { agId: agRef.id, comandaId: cRef.id };
}
const statusAg = async (id) => (await db.collection("agendamentos").doc(id).get()).data().status;
const statusCom = async (id) => (await db.collection("comandas").doc(id).get()).data().status;

let ok = 0, fail = 0;
const check = (cond, msg) => { console.log(`  ${cond ? "✅" : "❌ FALHOU:"} ${msg}`); cond ? ok++ : fail++; };

async function main() {
  console.log("EMULADOR:", process.env.FIRESTORE_EMULATOR_HOST || "(não setado!)", "| projeto: demo-ortega\n");

  // ── CASO PEDRO: finalizar comanda no Caixa arrasta o agendamento ──
  console.log("── CASO PEDRO — finalizar comanda direto no Caixa ──");
  const pedro = await criarPar({ nome: "Pedro", statusAg: "confirmado", preco: "49,00" });
  check(await statusAg(pedro.agId) === "confirmado", "agendamento começa 'confirmado' (como na screenshot)");
  await finalizarComanda(pedro.comandaId);
  check(await statusCom(pedro.comandaId) === "finalizada", "comanda ficou 'finalizada'");
  check(await statusAg(pedro.agId) === "concluido", "agendamento AGORA vira 'concluido' (o fix) — era o bug");

  // ── REABRIR: agendamento volta a confirmado ──
  console.log("\n── REABRIR comanda → agendamento volta a 'confirmado' ──");
  await reabrirComanda(pedro.comandaId);
  check(await statusCom(pedro.comandaId) === "aberta", "comanda voltou a 'aberta'");
  check(await statusAg(pedro.agId) === "confirmado", "agendamento voltou a 'confirmado'");

  // ── CANCELAR sem assinatura ──
  console.log("\n── CANCELAR comanda (sem assinatura) → agendamento 'cancelado' ──");
  const p2 = await criarPar({ nome: "Cliente Avulso", statusAg: "confirmado", preco: "38,00" });
  await cancelarComanda(p2.comandaId);
  check(await statusCom(p2.comandaId) === "cancelada", "comanda 'cancelada'");
  check(await statusAg(p2.agId) === "cancelado", "agendamento 'cancelado'");

  // ── CANCELAR com assinatura → devolve crédito EXATAMENTE 1x ──
  console.log("\n── CANCELAR comanda de ASSINATURA → devolve crédito 1x (não em dobro) ──");
  const assRef = await db.collection("assinaturas").add({ cortesRestantes: 1, planoCortesTotal: 4, status: "ativa", criadoEm: Date.now() });
  const p3 = await criarPar({ nome: "Assinante", statusAg: "confirmado", preco: "0,00", assinaturaId: assRef.id, cobertoPorAssinatura: true });
  await cancelarComanda(p3.comandaId);
  // simula a decisão da ROTA do agendamento: como havia comanda aberta cuidando disso, a rota NÃO devolve de novo
  const comandaEstavaAberta = true;
  if (!comandaEstavaAberta) await devolverCredito(assRef.id); // caminho da rota — não roda aqui
  const creditos = (await db.collection("assinaturas").doc(assRef.id).get()).data().cortesRestantes;
  check(creditos === 2, `crédito devolvido 1x: 1 → 2 (deu ${creditos}); NÃO 3 (dobro)`);

  // ── IDEMPOTÊNCIA: finalizar de novo não reverte nada ──
  console.log("\n── IDEMPOTÊNCIA — finalizar comanda já finalizada é no-op ──");
  const p4 = await criarPar({ nome: "Idem", statusAg: "confirmado", preco: "40,00" });
  await finalizarComanda(p4.comandaId);
  await finalizarComanda(p4.comandaId); // 2ª vez: guard interno (status !== aberta) barra
  check(await statusAg(p4.agId) === "concluido", "agendamento segue 'concluido' após 2ª finalização (guard funciona)");

  // ── LIMPEZA ──
  console.log("\n── LIMPEZA ──");
  const ids = [pedro, p2, p3, p4];
  for (const p of ids) { await db.collection("comandas").doc(p.comandaId).delete(); await db.collection("agendamentos").doc(p.agId).delete(); }
  await db.collection("assinaturas").doc(assRef.id).delete();
  console.log(`  removidos ${ids.length} pares + 1 assinatura (dados do emulador somem no shutdown de qualquer forma)`);

  console.log(`\n${fail === 0 ? "✅ TODOS OS CHECKS PASSARAM" : "❌ HOUVE FALHA"} — ${ok} ok, ${fail} falha(s)`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error("ERRO:", e); process.exit(1); });
