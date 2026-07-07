# Checklist de Deploy — Ortega

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

## Cloudinary (obrigatório — sem isso upload de imagens não funciona)

| Variável | Onde encontrar |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard → Settings → Account |
| `CLOUDINARY_API_KEY` | Cloudinary Dashboard → Settings → API Keys |
| `CLOUDINARY_API_SECRET` | Idem |

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
