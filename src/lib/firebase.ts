import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, Firestore } from "firebase/firestore";

// Liga o cliente ao emulador local quando NEXT_PUBLIC_USE_EMULATOR=1 (só em dev).
// Em produção a flag nunca é setada, então nada muda.
const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_EMULATOR === "1";

const firebaseConfig = {
  apiKey: USE_EMULATOR ? "demo-key" : process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  // No emulador o projectId precisa bater com o Admin SDK (aud dos tokens).
  projectId: USE_EMULATOR ? "demo-ortega" : process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getApp(): FirebaseApp {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
}

let emuladorConectado = false;
function conectarEmuladores(auth: Auth, db: Firestore) {
  if (emuladorConectado || !USE_EMULATOR || typeof window === "undefined") return;
  emuladorConectado = true;
  connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "localhost", 8080);
}

// Lazy getters — só inicializam no browser, nunca durante SSR/build
export const auth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    const a = getAuth(getApp());
    conectarEmuladores(a, getFirestore(getApp()));
    return (a as unknown as Record<string, unknown>)[prop as string];
  },
});

export const db: Firestore = new Proxy({} as Firestore, {
  get(_, prop) {
    const d = getFirestore(getApp());
    conectarEmuladores(getAuth(getApp()), d);
    return (d as unknown as Record<string, unknown>)[prop as string];
  },
});
