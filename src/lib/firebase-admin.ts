import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

function parsePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  // Normaliza independente de como o Vercel formatou a env var
  return raw.replace(/\\n/g, "\n").replace(/\\\\n/g, "\n");
}

// Quando as vars de emulador estão presentes, o Admin SDK fala com o emulador
// local — não precisa (nem deve usar) credencial de serviço real.
const USE_EMULATOR = !!process.env.FIRESTORE_EMULATOR_HOST || !!process.env.FIREBASE_AUTH_EMULATOR_HOST;

function getAdminApp(): App {
  if (getApps().length) return getApps()[0];
  if (USE_EMULATOR) {
    // No emulador o projectId precisa bater com o "aud" dos tokens emitidos.
    return initializeApp({ projectId: "demo-ortega" });
  }
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
      privateKey: parsePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
    }),
  });
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

// Aliases para retrocompatibilidade com código que importa diretamente
export const adminAuth = new Proxy({} as Auth, {
  get(_, prop) {
    const auth = getAdminAuth();
    const value = (auth as unknown as Record<string, unknown>)[prop as string];
    if (typeof value === "function") return (value as (...args: unknown[]) => unknown).bind(auth);
    return value;
  },
});

export const adminDb = new Proxy({} as Firestore, {
  get(_, prop) {
    const db = getAdminDb();
    const value = (db as unknown as Record<string, unknown>)[prop as string];
    if (typeof value === "function") return (value as (...args: unknown[]) => unknown).bind(db);
    return value;
  },
});

const ADMIN_COOKIE = "base_admin_session";
const BARBEIRO_COOKIE = "barbeiro_session";

export async function getSessionUser(req: import("next/server").NextRequest): Promise<{ uid: string; admin: boolean } | null> {
  const session = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!session) return null;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(session, true);
    return { uid: decoded.uid, admin: !!decoded.admin };
  } catch {
    return null;
  }
}

export async function getBarbeiroSession(
  req: import("next/server").NextRequest
): Promise<{ uid: string; barbeiroId: string } | null> {
  const session = req.cookies.get(BARBEIRO_COOKIE)?.value;
  if (!session) return null;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(session, true);
    if (!decoded.barbeiro || !decoded.barbeiroId) return null;
    return { uid: decoded.uid, barbeiroId: decoded.barbeiroId as string };
  } catch {
    return null;
  }
}
