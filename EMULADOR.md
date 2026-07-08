# Banco de dados local (Firebase Emulator)

Roda o sistema 100% offline, sem tocar no Firebase real nem gastar cota.
Emula **Firestore** + **Auth**. Requer Java (já instalado) — o `firebase-tools` é dev dependency.

## Como usar (2 terminais)

**Terminal 1 — sobe o emulador:**
```bash
npm run emulator
```
Deixe rodando. UI de inspeção em http://localhost:4000

**Terminal 2 — popula dados de teste (só na 1ª vez após subir o emulador):**
```bash
npm run seed:emulator
```
Cria o admin e alguns serviços/produtos. O emulador começa **vazio** a cada vez
que sobe (não persiste), então rode o seed sempre que reiniciar o emulador.

**Terminal 2 — sobe o Next apontando pro emulador:**
```bash
npm run dev:emulator
```

## Login
- **Email:** `tecnosuporte012@gmail.com`
- **Senha:** `Ortega@2026`

(Customizável via env `SEED_ADMIN_EMAIL` / `SEED_ADMIN_SENHA` ao rodar o seed.)

## Como funciona / segurança
- `dev:emulator` seta `NEXT_PUBLIC_USE_EMULATOR=1` + `FIRESTORE_EMULATOR_HOST` +
  `FIREBASE_AUTH_EMULATOR_HOST`. Sem essas flags, o app usa o Firebase real normalmente.
- No modo emulador, client e admin usam o projectId `demo-ortega` (precisa bater
  com o `aud` dos tokens). Nada disso vaza pra produção — a flag nunca é setada lá.
- O `npm run dev` normal continua batendo no Firebase configurado no `.env.local`.

## Persistir dados entre reinícios (opcional)
```bash
firebase emulators:start --project demo-ortega --import=./emu-data --export-on-exit
```
