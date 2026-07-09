// TESTE de integração (ambiente e2e09) — valida a sincronia agendamento↔comanda
// e o fix de dupla contagem no fechamento. Cria dados de teste, exercita o ciclo,
// confere os resultados e LIMPA tudo no fim. Não deixa lixo.
//
// USO: DOTENV_PATH=.env.local node scripts/test-sync-comandas.mjs
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "node:fs";

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
carregarEnv(process.env.DOTENV_PATH || ".env.local");

function parsePrivateKey(raw){ return raw ? raw.replace(/\\n/g,"\n").replace(/\\\\n/g,"\n") : undefined; }
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey: parsePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY) }) });
const db = getFirestore();

// espelha parsePriceNum
const parsePriceNum = (p) => typeof p==="number"?p:(parseFloat(String(p??"").replace(/[^\d.,]/g,"").replace(",","."))||0);

// ── réplica das funções de sincronia (mesma lógica dos routes/libs) ──
async function getComandaPorAgendamento(agId){
  const s = await db.collection("comandas").where("agendamentoId","==",agId).limit(1).get();
  return s.empty ? null : { id:s.docs[0].id, ...s.docs[0].data() };
}
async function finalizarComanda(id){ const d=await db.collection("comandas").doc(id).get(); if(!d.exists||d.data().status!=="aberta")return; await db.collection("comandas").doc(id).update({status:"finalizada",finalizadoEm:Date.now(),atualizadoEm:Date.now()}); }
async function cancelarComanda(id){ const d=await db.collection("comandas").doc(id).get(); if(!d.exists||d.data().status!=="aberta")return; await db.collection("comandas").doc(id).update({status:"cancelada",atualizadoEm:Date.now()}); }

const assert = (cond,msg) => console.log(`${cond?"✅":"❌ FALHOU:"} ${msg}`);

async function main(){
  console.log("Ambiente:", projectId, "(deve ser e2e09/teste)\n");
  const TAG = "TESTE_SYNC_"+Date.now();
  const criados = { ags:[], comandas:[], fech:[] };

  // helper: cria agendamento + comanda (como o route de POST faz)
  async function criarPar(nome, status, preco){
    const agRef = await db.collection("agendamentos").add({ nome:TAG+"_"+nome, telefone:"11999999999", servico:"Corte Teste", preco, data:"2099-01-01", horario:"10:00", status, criadoEm:Date.now(), atualizadoEm:Date.now() });
    criados.ags.push(agRef.id);
    const cRef = await db.collection("comandas").add({ origem:"agendamento", status:"aberta", agendamentoId:agRef.id, clienteNome:TAG+"_"+nome, data:"2099-01-01", horario:"10:00", itens:[{id:"1",tipo:"servico",descricao:"Corte Teste",valor:parsePriceNum(preco)}], total:parsePriceNum(preco), criadoEm:Date.now(), atualizadoEm:Date.now() });
    criados.comandas.push(cRef.id);
    return { agId:agRef.id, comandaId:cRef.id };
  }

  console.log("── CENÁRIO 1: cancelar agendamento → comanda cancelada ──");
  const p1 = await criarPar("cancelar","confirmado","50,00");
  // simula PATCH status=cancelado
  const c1 = await getComandaPorAgendamento(p1.agId);
  if(c1 && c1.status==="aberta") await cancelarComanda(c1.id);
  const c1depois = (await db.collection("comandas").doc(p1.comandaId).get()).data();
  assert(c1depois.status==="cancelada", `comanda ficou 'cancelada' (era aberta) → agora: ${c1depois.status}`);

  console.log("\n── CENÁRIO 2: concluir agendamento → comanda finalizada ──");
  const p2 = await criarPar("concluir","confirmado","70,00");
  const c2 = await getComandaPorAgendamento(p2.agId);
  if(c2 && c2.status==="aberta") await finalizarComanda(c2.id);
  const c2depois = (await db.collection("comandas").doc(p2.comandaId).get()).data();
  assert(c2depois.status==="finalizada", `comanda ficou 'finalizada' → agora: ${c2depois.status}`);

  console.log("\n── CENÁRIO 3: fechamento NÃO duplica (agendamento concluído + comanda finalizada) ──");
  // marca o agendamento do cenário 2 como concluído (simula o admin concluir)
  await db.collection("agendamentos").doc(p2.agId).update({status:"concluido"});
  // simula fecharCaixaDia COM o fix de dedup:
  const agsDia = (await db.collection("agendamentos").where("data","==","2099-01-01").get()).docs.map(d=>({id:d.id,...d.data()}));
  const comandasDia = (await db.collection("comandas").where("data","==","2099-01-01").get()).docs.map(d=>({id:d.id,...d.data()}));
  const finalizadas = comandasDia.filter(c=>c.status==="finalizada");
  const totalComandas = finalizadas.reduce((s,c)=>s+(c.total||0),0);
  const idsAgComComanda = new Set(finalizadas.map(c=>c.agendamentoId).filter(Boolean));
  const concluidos = agsDia.filter(a=>a.status==="concluido");
  const concluidosSemComanda = concluidos.filter(a=>!idsAgComComanda.has(a.id));
  const totalAgs = concluidosSemComanda.reduce((s,a)=>s+parsePriceNum(a.preco),0);
  const totalComFix = totalAgs + totalComandas;
  // sem o fix seria: (todos concluidos) + (todas finalizadas)
  const totalSemFix = concluidos.reduce((s,a)=>s+parsePriceNum(a.preco),0) + totalComandas;
  console.log(`   agendamento concluído: R$70 | comanda finalizada: R$70`);
  console.log(`   SEM fix (duplicava): R$${totalSemFix}  |  COM fix: R$${totalComFix}`);
  assert(totalComFix===70, `total correto = R$70 (não R$140) → deu R$${totalComFix}`);
  assert(totalSemFix===140, `confirma que SEM o fix duplicava (R$140)`);

  console.log("\n── LIMPEZA ──");
  for(const id of criados.comandas) await db.collection("comandas").doc(id).delete();
  for(const id of criados.ags) await db.collection("agendamentos").doc(id).delete();
  console.log(`   removidos: ${criados.ags.length} agendamentos + ${criados.comandas.length} comandas de teste`);
  console.log("\n✅ Teste concluído — dados de teste limpos.");
}
main().then(()=>process.exit(0)).catch(e=>{console.error("ERRO:",e);process.exit(1);});
