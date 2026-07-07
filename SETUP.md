# SETUP — Configuração de ambiente do Ortega

> Este arquivo é o checklist pra quando o projeto for configurado num ambiente novo
> (contas do cliente: Firebase, Vercel, Cloudflare R2). Siga na ordem.
> **Leia isto ANTES de dar deploy no ambiente novo.**

---

## 1. Variáveis de ambiente (Vercel → Settings → Environment Variables)

Todas essas precisam existir no Vercel do ambiente. As de Firebase/R2 vocês já conhecem;
abaixo está a **lista completa**, incluindo as novas.

### Firebase (Admin SDK)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`  *(cuidado com as quebras de linha `\n`)*

### Firebase (client / público)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Cloudflare R2 (upload de imagens)
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_URL`

### Web Push (notificações)
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

### 🆕 Auto-confirmação de agendamento (NOVO)
- `CRON_SECRET` — uma senha aleatória qualquer (ex: gere com `openssl rand -hex 32`).
  Protege o endpoint que confirma agendamentos automaticamente.
  **Se esta variável não existir, a auto-confirmação simplesmente não roda (o site NÃO quebra).**

---

## 2. Auto-confirmação de agendamento — cron externo

A confirmação automática "após X minutos" precisa de algo batendo no site de tempos em tempos.
Como estamos no **plano Vercel Hobby (grátis)**, o cron nativo do Vercel só roda 1x/dia — não serve.
Usamos um cron externo grátis: **cron-job.org**.

### Passo a passo (fazer DEPOIS que o domínio estiver no ar):

1. Crie uma conta grátis em https://cron-job.org
2. **Create cronjob**:
   - **Title:** Ortega — auto-confirmar agendamentos
   - **URL:** `https://SEU-DOMINIO.com/api/cron/auto-confirmar`
   - **Schedule:** a cada 5 minutos (Every 5 minutes)
3. Na aba **Advanced / Headers**, adicione um header:
   - **Key:** `Authorization`
   - **Value:** `Bearer <o mesmo valor de CRON_SECRET>`
4. Salve e clique em **Run now** pra testar. Deve retornar `200 OK`.

Pronto. A cada 5 min o cron verifica agendamentos pendentes e confirma os que passaram do tempo
configurado no admin (Configurações → Confirmação de agendamento).

> **Se migrar pra Vercel Pro no futuro:** dá pra usar o cron nativo do Vercel (`vercel.json`)
> e aposentar o cron-job.org. Mas com Hobby, cron-job.org é o caminho.

---

## 3. Firestore — regras e índices

- Copie as regras de segurança do Firestore do ambiente antigo.
- Coleções usadas: `agendamentos`, `settings`, `fechamentos`, `assinaturas`, `barbeiros`, etc.

---

## 4. Checklist final antes de considerar "no ar"

- [ ] Todas as env vars acima configuradas no Vercel
- [ ] `CRON_SECRET` definido
- [ ] cron-job.org apontando pro endpoint e testado (Run now → 200)
- [ ] Login admin funciona
- [ ] Criar um agendamento de teste e ver a auto-confirmação funcionar
- [ ] Upload de imagem (R2) funciona
- [ ] Notificações push funcionam
