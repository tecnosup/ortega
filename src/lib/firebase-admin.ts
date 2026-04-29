import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

function parsePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  // Normaliza independente de como o Vercel formatou a env var
  return raw.replace(/\\n/g, "\n").replace(/\\\\n/g, "\n");
}

function getAdminApp(): App {
  if (getApps().length) return getApps()[0];
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
    return (getAdminAuth() as unknown as Record<string, unknown>)[prop as string];
  },
});

export const adminDb = new Proxy({} as Firestore, {
  get(_, prop) {
    return (getAdminDb() as unknown as Record<string, unknown>)[prop as string];
  },
});

const ADMIN_COOKIE = "base_admin_session";

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
