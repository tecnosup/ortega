import "server-only";
import webpush from "web-push";
import { getAdminDb } from "./firebase-admin";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushSubscriptionDoc {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  criadoEm: number;
}

export async function saveSubscription(sub: PushSubscriptionDoc) {
  const db = getAdminDb();
  // usa endpoint como id para evitar duplicatas
  const id = Buffer.from(sub.endpoint).toString("base64").slice(0, 100);
  await db.collection("push_subscriptions").doc(id).set(sub);
}

export async function removeSubscription(endpoint: string) {
  const db = getAdminDb();
  const id = Buffer.from(endpoint).toString("base64").slice(0, 100);
  await db.collection("push_subscriptions").doc(id).delete();
}

async function sendToCollection(
  collectionName: string,
  title: string,
  body: string,
  url: string,
  barbeiroId?: string
) {
  const db = getAdminDb();
  let query = db.collection(collectionName) as FirebaseFirestore.Query;
  if (barbeiroId) query = query.where("barbeiroId", "==", barbeiroId);
  const snap = await query.get();
  if (snap.empty) return;

  const payload = JSON.stringify({ title, body, url });

  await Promise.allSettled(
    snap.docs.map(async (doc) => {
      const sub = doc.data() as PushSubscriptionDoc;
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await doc.ref.delete();
      }
    })
  );
}

export async function sendPushToAll(title: string, body: string, url = "/admin/agendamentos") {
  await sendToCollection("push_subscriptions", title, body, url);
}

export interface BarbeiroPushSubscriptionDoc extends PushSubscriptionDoc {
  barbeiroId: string;
}

export async function saveBarbeiroSubscription(sub: BarbeiroPushSubscriptionDoc) {
  const db = getAdminDb();
  const id = Buffer.from(sub.endpoint).toString("base64").slice(0, 100);
  await db.collection("push_subscriptions_barbeiro").doc(id).set(sub);
}

export async function removeBarbeiroSubscription(endpoint: string) {
  const db = getAdminDb();
  const id = Buffer.from(endpoint).toString("base64").slice(0, 100);
  await db.collection("push_subscriptions_barbeiro").doc(id).delete();
}

export async function sendPushToBarbeiro(barbeiroId: string, title: string, body: string, url = "/barbeiro") {
  await sendToCollection("push_subscriptions_barbeiro", title, body, url, barbeiroId);
}
