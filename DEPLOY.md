# Checklist de Deploy — Ortega Barber

Antes de qualquer deploy em produção (Vercel), confirme que todas as variáveis abaixo estão configuradas em **Settings → Environment Variables → Production**.

## Firebase Admin (obrigatório — sem isso nada salva no admin)

| Variável | Onde encontrar |
|---|---|
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase Console → Configurações do projeto → ID do projeto |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Firebase Console → Configurações do projeto → Contas de serviço → Gerar nova chave privada |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Mesmo JSON da conta de serviço — campo `private_key` (copiar com as quebras de linha `\n`) |

## Firebase Client (obrigatório — sem isso o login não funciona)

| Variável | Onde encontrar |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Configurações do projeto → Seus apps |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Idem |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Idem |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Idem |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Idem |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Idem |

## Cloudflare R2 (obrigatório — sem isso upload de imagens não funciona)

| Variável | Onde encontrar |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → R2 |
| `R2_ACCESS_KEY_ID` | Cloudflare Dashboard → R2 → Manage API tokens |
| `R2_SECRET_ACCESS_KEY` | Idem |
| `R2_BUCKET_NAME` | Nome do bucket criado no R2 |
| `R2_PUBLIC_URL` | URL pública do bucket (ex: `https://pub-xxx.r2.dev`) |

## Outros

| Variável | Para que serve |
|---|---|
| `ADMIN_CLAIM_SECRET` | Rota `/api/admin/set-claim` — setar claims de admin manualmente |

## Como verificar se está faltando alguma

Se ao clicar em salvar o formulário volta sem mensagem de erro, ou se o login retorna 401, o problema é env var faltando. Verifique os logs do Vercel em **Deployments → Functions → Logs**.

## Atenção com o FIREBASE_ADMIN_PRIVATE_KEY

O Vercel pode quebrar as quebras de linha. Se o login admin funciona localmente mas não em produção, edite a variável no Vercel e certifique-se que o valor está assim:

```
-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n
```

Sem aspas, com `\n` literal (não quebra de linha real).
