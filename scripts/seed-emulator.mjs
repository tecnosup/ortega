/**
 * Popula o Firebase Emulator local com um admin e dados realistas de barbearia.
 * Uso: npm run seed:emulator   (com o emulador rodando)
 *
 * NÃO toca em produção: só funciona se as vars de emulador estiverem setadas.
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Garante que estamos falando com o emulador, nunca com produção.
process.env.FIRESTORE_EMULATOR_HOST ||= "localhost:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "localhost:9099";

const PROJECT_ID = process.env.FIREBASE_ADMIN_PROJECT_ID || "demo-ortega";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "tecnosuporte012@gmail.com";
const ADMIN_SENHA = process.env.SEED_ADMIN_SENHA || "Ortega@2026";

const app = initializeApp({ projectId: PROJECT_ID });
const auth = getAuth(app);
const db = getFirestore(app);

const hoje = new Date().toISOString().split("T")[0];
const now = Date.now();

async function seedAdmin() {
  let user;
  try {
    user = await auth.getUserByEmail(ADMIN_EMAIL);
    await auth.updateUser(user.uid, { password: ADMIN_SENHA });
    console.log(`• admin já existia — senha sincronizada: ${ADMIN_EMAIL} / ${ADMIN_SENHA}`);
  } catch {
    user = await auth.createUser({ email: ADMIN_EMAIL, password: ADMIN_SENHA, emailVerified: true });
    console.log(`✓ admin criado: ${ADMIN_EMAIL} / senha: ${ADMIN_SENHA}`);
  }
  await auth.setCustomUserClaims(user.uid, { admin: true });
  console.log(`✓ claim admin:true aplicada`);
}

/** Zera uma coleção antes de popular, pra o seed ser idempotente. */
async function limpar(colecao) {
  const snap = await db.collection(colecao).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

async function seedServicos() {
  await limpar("servicos");
  const servicos = [
    { titulo: "Corte masculino",    descricao: "Corte na tesoura ou máquina, acabamento na navalha", preco: "45,00", duracao: "30 min" },
    { titulo: "Corte + Barba",      descricao: "Combo completo, o mais pedido da casa",              preco: "70,00", duracao: "50 min" },
    { titulo: "Barba",              descricao: "Modelagem, toalha quente e finalização",             preco: "35,00", duracao: "25 min" },
    { titulo: "Corte infantil",     descricao: "Para crianças até 12 anos",                          preco: "40,00", duracao: "30 min" },
    { titulo: "Pézinho / acabamento", descricao: "Retoque rápido de contorno",                       preco: "20,00", duracao: "15 min" },
    { titulo: "Sobrancelha",        descricao: "Alinhamento na navalha",                             preco: "15,00", duracao: "10 min" },
    { titulo: "Platinado / descoloração", descricao: "Descoloração global (sob avaliação)",          preco: "150,00", duracao: "120 min" },
    { titulo: "Pigmentação de barba", descricao: "Preenchimento de falhas",                          preco: "50,00", duracao: "40 min" },
  ];
  let order = 0;
  for (const s of servicos) {
    await db.collection("servicos").add({ ...s, imagem: "", status: "published", order: order++, createdAt: now, updatedAt: now });
  }
  console.log(`✓ ${servicos.length} serviços criados`);
}

async function seedProdutos() {
  await limpar("produtos");
  const produtos = [
    { titulo: "Pomada modeladora matte", descricao: "Fixação forte, efeito seco",  preco: "39,90", estoque: 12, estoqueMinimo: 3 },
    { titulo: "Pomada efeito molhado",   descricao: "Brilho e fixação média",       preco: "37,90", estoque: 8,  estoqueMinimo: 3 },
    { titulo: "Shampoo anticaspa",       descricao: "200ml",                        preco: "29,90", estoque: 15, estoqueMinimo: 4 },
    { titulo: "Óleo para barba",         descricao: "Hidrata e amacia — 30ml",      preco: "34,90", estoque: 6,  estoqueMinimo: 2 },
    { titulo: "Balm para barba",         descricao: "Modela e nutre",               preco: "32,90", estoque: 2,  estoqueMinimo: 3 },
    { titulo: "Minoxidil 5%",            descricao: "Frasco 60ml",                  preco: "59,90", estoque: 10, estoqueMinimo: 3 },
  ];
  let order = 0;
  for (const p of produtos) {
    await db.collection("produtos").add({ ...p, imagem: "", status: "published", order: order++, createdAt: now, updatedAt: now });
  }
  console.log(`✓ ${produtos.length} produtos criados`);
}

async function seedBarbeiros() {
  await limpar("barbeiros");
  // Por enquanto só o Igor (confirmado pelo Vitor).
  await db.collection("barbeiros").add({
    nome: "Igor", apelido: "Igor", email: "igor@ortega.local",
    telefone: "(00) 00000-0000", comissao: 50, ativo: true, presenteHoje: true,
    criadoEm: now,
  });
  console.log(`✓ 1 barbeiro criado (Igor)`);
}

async function seedComandas() {
  await limpar("comandas");
  const comandas = [
    // Abertas (aguardando finalização — aparecem no card "Comandas do dia")
    { status: "aberta", origem: "agendamento", clienteNome: "João Pereira", horario: "14:00",
      itens: [{ id: "1", tipo: "servico", descricao: "Corte + Barba", valor: 70 }] },
    { status: "aberta", origem: "avulsa", clienteNome: "Marcos Silva",
      itens: [
        { id: "1", tipo: "servico", descricao: "Corte masculino", valor: 45 },
        { id: "2", tipo: "produto", descricao: "Pomada modeladora matte", valor: 39.9 },
      ] },
    // Finalizada (já entrou no caixa)
    { status: "finalizada", origem: "avulsa", clienteNome: "Carlos Souza", formaPagamento: "Pix", finalizadoEm: now,
      itens: [{ id: "1", tipo: "servico", descricao: "Barba", valor: 35 }] },
  ];
  for (const c of comandas) {
    const total = c.itens.reduce((s, i) => s + i.valor, 0);
    await db.collection("comandas").add({ ...c, data: hoje, total, criadoEm: now, atualizadoEm: now });
  }
  console.log(`✓ ${comandas.length} comandas de exemplo criadas (2 abertas + 1 finalizada)`);
}

// Reproduz o CASO PEDRO: agendamento confirmado + comanda vinculada aberta.
// Finalize essa comanda no Caixa e volte na grade de Agendamentos: o Pedro
// deve virar "Concluído" (o fix do sync reverso). Sem o fix, ficava "Confirmado".
async function seedCasoPedro() {
  await limpar("agendamentos");
  const agRef = await db.collection("agendamentos").add({
    nome: "Pedro", telefone: "5512982006310", servico: "Corte na Tesoura",
    preco: "41,00", data: hoje, horario: "17:30", status: "confirmado",
    barbeiroNome: "Igor", visualizadoAdmin: true, criadoEm: now, atualizadoEm: now,
  });
  await db.collection("comandas").add({
    origem: "agendamento", status: "aberta", agendamentoId: agRef.id,
    clienteNome: "Pedro", data: hoje, horario: "17:30", barbeiroNome: "Igor",
    itens: [
      { id: "1", tipo: "servico", descricao: "Corte na Tesoura", valor: 41 },
      { id: "2", tipo: "servico", descricao: "Sobrancelha", valor: 8 },
    ],
    total: 49, criadoEm: now, atualizadoEm: now,
  });
  console.log(`✓ CASO PEDRO criado: agendamento 'confirmado' + comanda 'aberta' vinculada (finalize e confira a grade)`);
}

async function seedGastos() {
  await limpar("gastos_dia");
  const gastos = [
    { descricao: "Compra de produtos (fornecedor)", valor: 180 },
    { descricao: "Lanche da equipe", valor: 45 },
  ];
  for (const g of gastos) {
    await db.collection("gastos_dia").add({ ...g, data: hoje, criadoEm: now });
  }
  console.log(`✓ ${gastos.length} despesas do dia criadas`);
}

await seedAdmin();
await seedServicos();
await seedProdutos();
await seedBarbeiros();
await seedComandas();
await seedCasoPedro();
await seedGastos();
console.log("\n✅ Seed concluído. Entre no admin com:", ADMIN_EMAIL, "/", ADMIN_SENHA);
process.exit(0);
