# Contexto para nova sessão — Ortega (Cardoso)

Cole este arquivo inteiro como primeira mensagem ao Claude após /clear.

---

## Projeto
SaaS de barbearia. Stack: **Next.js 16.2.4** (App Router), React 19, TypeScript, Tailwind CSS v4, Firebase Admin SDK (Firestore + Auth), Firebase Client SDK, Cloudflare R2 (upload), Framer Motion, Zod, server actions.
Build: `npm run build` → `next build --webpack` (nunca turbopack).

## Dois devs
- **Cardoso (você)**: admin geral, landing, funcionários, produtos, categorias, auditoria
- **Vitor**: financeiro, agendamentos, portal barbeiro (`/barbeiro/*`)
- Não mexa em `src/app/barbeiro/`, `src/app/api/barbeiro/`, `src/app/admin/(protected)/financeiro/`, `src/app/admin/(protected)/agendamentos/`

## Git — regra obrigatória
```
main  → produção (Vercel auto-deploy)
dev   → integração/testes
feat/ → onde todo trabalho acontece
```
**Nunca commitar direto em `main` ou `dev`.** Fluxo:
```bash
git checkout dev && git pull origin dev
git checkout -b feat/<nome>
# ... trabalha, commita ...
# PR: feat/<nome> → dev → testa preview → merge em main
```

## Como rodar local
```bash
cd c:/Users/cardo/ortega
npm run dev
# http://localhost:3000
# Admin: http://localhost:3000/admin/login
# Login: tecnosuporte012@gmail.com / Ortega@2026
```
`.env.local` já existe com Firebase Admin + Firebase Client. **Falta R2** (upload de imagem não funciona local — não é blocker para testar CRUD).

## Estado atual da main (2026-05-13)

### Funcionando
- Login admin, session cookie, claims Firebase
- Produtos: CRUD + upload + desconto + categoria + estoque
- Serviços/itens: CRUD
- Categorias de produtos: CRUD
- Descontos: CRUD
- Landing: Hero, Sobre, Serviços (grid), Produtos (com modal, scroll travado), sem GSAP
- Auditoria com reverter ação

### Pendente / problemático
- **Funcionários (`/admin/barbeiros`)**: UI completo mas criar/editar ainda não foi testado localmente de ponta a ponta. Fixes de `undefined` no Firestore foram commitados direto na `main` sem testar local — podem ter outros problemas.
- **Upload de imagem** em produção: depende das vars R2 que ainda não foram configuradas no Vercel.

## Tarefa prioritária: Funcionários — fechar de ponta a ponta

### Fluxo correto desta sessão
1. `git checkout -b feat/funcionarios-fix`
2. `npm run dev` → testar localmente: criar, editar, deletar, criar acesso portal, revogar
3. Corrigir o que quebrar (ver console do servidor no terminal)
4. Build limpo: `npm run build`
5. PR feat/funcionarios-fix → dev → merge → main

### Arquivos do módulo Funcionários
| Arquivo | Papel |
|---|---|
| `src/app/admin/(protected)/barbeiros/page.tsx` | UI client-side — modal criar/editar, lista |
| `src/app/api/admin/barbeiros/route.ts` | GET lista, POST cria |
| `src/app/api/admin/barbeiros/[id]/route.ts` | GET um, PATCH atualiza, DELETE remove |
| `src/app/api/admin/barbeiros/[id]/conta/route.ts` | POST cria conta Firebase Auth + claim barbeiro, DELETE revoga |
| `src/lib/barbeiros.ts` | CRUD Firestore (já tem filtro de undefined) |
| `src/lib/barbeiros-types.ts` | Interface Barbeiro (tem tipo, comissoesServico) |

### Interface Barbeiro atual
```ts
interface ComissaoServico { servicoId: string; percentual: number; }
interface Barbeiro {
  id: string;
  nome: string;
  apelido?: string;
  foto?: string;
  email?: string;
  uid?: string;
  comissao: number;
  ativo: boolean;
  tipo?: "barbeiro" | "faxineira" | "secretaria";
  comissoesServico?: ComissaoServico[];
  createdAt: number;
  updatedAt: number;
}
```

### Regras Firestore (crítico)
- **Nunca passar `undefined`** para `.add()` ou `.update()` — Firestore rejeita com 500
- `JSON.stringify` descarta `undefined`, então o que chega no body do POST nunca tem `undefined` — mas conferir
- `lib/barbeiros.ts` já tem: `Object.fromEntries(Object.entries({...}).filter(([,v]) => v !== undefined))`

## Regras técnicas gerais
1. `credentials: "include"` em todo fetch do admin
2. `export const dynamic = "force-dynamic"` em rotas de API autenticadas
3. `font-size: 16px` em inputs (evita zoom iOS)
4. Firestore: nunca `undefined`, usar `null` ou omitir
5. Commits: `feat:` / `fix:` / `refactor:` — sem Co-Author se não quiser

## Paleta (seguir sempre)
- Fundo: `#0A0A0A` | Texto: `#F5E6C8` | Ouro: `#b8944a` / `#C9A84C` | Borda: `#2d2d2d` | Card: `#111`
