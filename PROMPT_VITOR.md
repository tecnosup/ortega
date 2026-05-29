# Prompt de onboarding — Vitor

> Cole este prompt inteiro no Claude antes de começar a trabalhar no projeto.

---

Você está me ajudando a desenvolver o **Ortega Barber**, um sistema de agendamento online para barbearia premium. Sou o Vitor, um dos dois desenvolvedores do projeto. O Cardoso é o outro — cada um tem sua área de responsabilidade para evitar conflito de código.

---

## Stack

- **Next.js 16.2.4** com App Router — esta versão tem breaking changes em relação a versões anteriores. Leia os guias em `node_modules/next/dist/docs/` antes de escrever código.
- **React 19**, **TypeScript**
- **Tailwind CSS v4** com `@theme` tokens (sintaxe diferente do Tailwind 3)
- **Firebase Auth** — login via `signInWithEmailAndPassword`, troca de token por session cookie via API interna
- **Firebase Admin SDK** — `getAdminDb()` chamado por request, nunca como singleton
- **Firestore** — banco principal
- **Recharts** — gráficos (AreaChart, PieChart donut)
- **Zod** — validação de formulários
- **React Hook Form** com `@hookform/resolvers`
- **Deploy:** Vercel, branch `main` → produção automática

---

## Paleta de cores (seguir sempre)

| Token | Valor | Uso |
|---|---|---|
| Fundo | `#0A0A0A` | background geral |
| Texto | `#F5E6C8` | texto principal |
| Ouro | `#b8944a` / `#C9A84C` | destaques, CTAs |
| Borda | `#2d2d2d` | bordas de cards |
| Card | `#111` | fundo de cards |

---

## Regras técnicas obrigatórias

1. **`credentials: "include"`** em todo `fetch` do portal do barbeiro — sem isso a session cookie não é enviada e a API retorna 401.
2. **Firestore rejeita `undefined`** — sempre filtrar campos antes de `.add()` ou `.update()`.
3. **`export const dynamic = "force-dynamic"`** em todas as rotas de API e layouts autenticados.
4. **Cookie `secure`** só em produção — não definir em dev.
5. **`orderBy` duplo** requer índice composto no Firestore — evitar; usar `orderBy("criadoEm","desc")` + sort em memória quando necessário.
6. **`font-size: 16px`** em todos os `<input>` — evita zoom automático no iOS.
7. Nunca usar `undefined` em campos do Firestore — usar `null` ou omitir o campo.

---

## Minha área de responsabilidade (Vitor)

Trabalho exclusivamente nestes arquivos/pastas:

```
src/app/barbeiro/**                        portal do barbeiro (agenda + financeiro)
src/app/api/barbeiro/**                    APIs do portal (autenticadas por cookie de barbeiro)
src/app/(public)/agendamento/**            fluxo de agendamento público (3 steps)
src/app/agendamento/status/**              status do agendamento para o cliente
src/app/admin/(protected)/financeiro/**    financeiro no painel admin
src/app/admin/(protected)/agendamentos/**  agendamentos no painel admin
src/lib/agendamentos.ts                    CRUD Firestore de agendamentos
src/lib/agendamentos-types.ts              tipos de agendamento
src/lib/barbeiros.ts                       CRUD Firestore de barbeiros
src/lib/barbeiros-types.ts                 tipo Barbeiro
```

**Não tocar** em auditoria, produtos, landing page, nem no `src/components/admin/AdminNav.tsx` sem avisar o Cardoso primeiro.

---

## Estrutura do portal do barbeiro

### Autenticação
- Login em `/barbeiro/login` via Firebase Auth (`signInWithEmailAndPassword`)
- Após login, troca o `idToken` por session cookie via `POST /api/barbeiro/session`
- O cookie criado é `barbeiro_session` (diferente do cookie admin `base_admin_session`)
- Guard em `src/components/barbeiro/BarbeiroAuthGuard.tsx` protege o portal

### Páginas do portal
- `/barbeiro` → `src/app/barbeiro/(portal)/page.tsx` — agenda diária do barbeiro
- `/barbeiro/financeiro` → `src/app/barbeiro/(portal)/financeiro/page.tsx` — KPIs + tabela de atendimentos concluídos com filtro de período

### APIs do portal (todas leem o cookie `barbeiro_session`)
- `GET /api/barbeiro/agendamentos?data=YYYY-MM-DD` — agendamentos do barbeiro autenticado naquela data
- `GET /api/barbeiro/financeiro?inicio=YYYY-MM-DD&fim=YYYY-MM-DD` — KPIs do período
- `POST /api/barbeiro/session` — cria a session cookie a partir do idToken
- `POST /api/barbeiro/push-subscription` — registra subscription de push notification

### Tipo Barbeiro
```ts
interface Barbeiro {
  id: string;
  nome: string;
  apelido?: string;
  foto?: string;
  comissao: number;   // percentual, ex: 40 = 40%
  ativo: boolean;
  uid?: string;       // Firebase Auth UID vinculado
  email?: string;
  createdAt: number;
  updatedAt: number;
}
```

---

## Fluxo de agendamento público

Localizado em `src/app/(public)/agendamento/page.tsx` — client component com 4 steps:

1. Escolha do serviço
2. Escolha do barbeiro
3. Escolha de data e horário (`?barbeiroId=xxx` filtra slots ocupados por aquele barbeiro)
4. Dados do cliente + cupom de desconto

Após confirmação, polling de status e link para `/agendamento/status?tel=XXX`.

---

## Collection Firestore: `agendamentos`

Campos relevantes:

```
data: string          "YYYY-MM-DD"
horario: string       "09:00"
cliente: string
telefone: string
servico: string
preco: string         valor formatado "R$ 50,00"
status: string        "pendente" | "confirmado" | "concluido" | "cancelado"
barbeiroId: string    ID do barbeiro (desnormalizado)
barbeiroNome: string  nome do barbeiro (desnormalizado)
criadoEm: Timestamp
visualizadoAdmin: boolean
```

---

## Collection Firestore: `barbeiros`

```
nome: string
apelido?: string
foto?: string         URL Cloudinary
comissao: number
ativo: boolean
uid?: string          Firebase Auth UID
email?: string
createdAt: number     timestamp ms
updatedAt: number     timestamp ms
```

---

## Fluxo de trabalho (git)

```
main   ← produção — nunca commitar direto, requer PR aprovado
dev    ← integração
feat/  ← suas branches de feature
```

```bash
# Antes de começar qualquer feature:
git checkout dev
git pull origin dev
git checkout -b feat/nome-da-feature

# Ao terminar, abrir PR: feat/xxx → dev
# Cardoso revisa e aprova
```

---

## Setup inicial

```bash
git clone https://github.com/tecnosup/ortega.git
cd ortega
npm install
git checkout dev
```

Pedir o arquivo `.env.local` para o Cardoso — contém as chaves do Firebase, Stripe, Cloudinary e VAPID (push notifications). Sem ele o projeto não roda.

---

## Padrão de componentes

- Componentes client: `"use client"` no topo, estado com `useState`/`useCallback`
- Componentes server: sem diretiva, `async function`, `await` direto
- Ícones: `lucide-react` — usar apenas ícones já importados no arquivo
- Nunca criar arquivos de comentários, planos ou análises — trabalhar direto no código
- Commits no padrão: `feat:`, `fix:`, `refactor:`
