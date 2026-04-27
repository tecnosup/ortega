# pasta-base

Esqueleto neutro para projetos de landing page + painel admin. Ponto de partida da fábrica de sites.

---

## Stack

- Next.js 15 (App Router) + TypeScript
- TailwindCSS 3.4
- Firebase Auth + Firestore + Admin SDK
- Cloudinary (upload server-side)
- React Hook Form + Zod
- Framer Motion (instalado, pronto para uso)

---

## Setup

### 1. Configurar variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha todas as variáveis no `.env.local`.

### 2. Configurar Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um novo projeto
3. Ative **Authentication → Email/Senha**
4. Crie um banco **Firestore** (modo produção)
5. Gere uma **Service Account** em Configurações do projeto → Contas de serviço → Gerar nova chave privada
6. Copie os valores para as variáveis `FIREBASE_ADMIN_*` no `.env.local`
7. Copie os valores do SDK web para as variáveis `NEXT_PUBLIC_FIREBASE_*`

### 3. Configurar Cloudinary

1. Acesse [cloudinary.com](https://cloudinary.com) e crie uma conta
2. No Dashboard, copie Cloud Name, API Key e API Secret para as variáveis `CLOUDINARY_*`

### 4. Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

### 5. Criar o usuário admin

1. Crie o usuário manualmente no Firebase Console (Authentication → Adicionar usuário)
2. Copie o UID do usuário
3. Faça uma requisição POST para `/api/admin/set-claim`:

```bash
curl -X POST http://localhost:3000/api/admin/set-claim \
  -H "Content-Type: application/json" \
  -d '{"uid": "SEU_UID_AQUI", "secret": "valor_do_ADMIN_CLAIM_SECRET"}'
```

4. Acesse `/admin/login` e entre com email e senha

### 6. Deploy no Vercel

**Fluxo recomendado: branch `dev` para testes, `main` para produção.**

```bash
# Instale o CLI do Vercel
npm i -g vercel

# Conecte o projeto
vercel link
```

Configure as mesmas variáveis de ambiente no painel Vercel (Settings → Environment Variables).

- Push em qualquer branch diferente de `main` → gera URL de preview automática (ambiente de teste)
- Push em `main` → deploy em produção

---

## Checklist de personalização para novo cliente

- [ ] Trocar `NEXT_PUBLIC_SITE_NAME` para o nome do cliente
- [ ] Substituir `[LOGO]` pelo logo real (Navbar, Footer, AdminNav, Login)
- [ ] Definir paleta de cores no `tailwind.config.ts`
- [ ] Trocar fonte no `layout.tsx` (Google Fonts)
- [ ] Preencher textos reais via `/admin/configuracoes`
- [ ] Substituir placeholders de imagem por imagens reais
- [ ] Plugar fluxo de conversão em `/api/contato` (WhatsApp, gateway, agendamento, etc.)
- [ ] Ajustar CRUD de itens para o tipo de negócio (renomear campos, adicionar novos)
- [ ] Configurar domínio customizado no Vercel
- [ ] Adicionar Google Analytics (criar componente `Analytics.tsx` com o GA_ID do cliente)
- [ ] Criar branch `dev` no repositório para ambiente de testes

---

## Estrutura de pastas

```
src/
├── app/
│   ├── (public)/          ← Landing page pública
│   ├── admin/             ← Painel admin
│   └── api/               ← API routes
├── components/
│   ├── ui/                ← Botões, inputs, componentes genéricos
│   ├── landing/           ← Seções da landing
│   └── admin/             ← Componentes do painel
└── lib/                   ← Firebase, Cloudinary, helpers
```
