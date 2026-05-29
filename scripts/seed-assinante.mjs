import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const get = (key) => {
  const m = env.match(new RegExp(`${key}="?([^"\n]+)"?`));
  return m ? m[1].trim() : "";
};

const privateKey = get("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n");

initializeApp({
  credential: cert({
    projectId: get("FIREBASE_ADMIN_PROJECT_ID"),
    clientEmail: get("FIREBASE_ADMIN_CLIENT_EMAIL"),
    privateKey,
  }),
});

const db = getFirestore();
const now = Date.now();

const ref = await db.collection("assinaturas").add({
  stripeSubscriptionId: "sub_teste_local",
  stripeCustomerId: "cus_teste_local",
  planoId: "mensal",
  planoCortesTotal: 2,
  cortesRestantes: 2,
  status: "ativa",
  clienteNome: "Cliente Teste",
  clienteEmail: "teste@ortega.com",
  clienteTelefone: "11999999999",
  senhaHash: "$2b$12$.DfidtxfUo1vWy0eNjzvnOYHmuHPGMO6ZtxrjlVJYdKcwnXjKTXGO",
  inicioEm: now,
  proximoVencimento: now + 30 * 24 * 60 * 60 * 1000,
  criadoEm: now,
  atualizadoEm: now,
});

console.log("Assinante de teste criado:", ref.id);
process.exit(0);
