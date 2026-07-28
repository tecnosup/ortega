# Número de clientes na landing + safe-area do PWA — notas da atualização

**Branch:** `feat/socio-pwa-manifest` (branch do PWA que estava parada desde 20/07, retomada com `dev` mergeado por cima)
**Contexto:** prints do Igor — a landing mostrava `0+ clientes` no celular, e o `500+` que deveria aparecer era inventado desde que o site nasceu.
**Status:** typecheck limpo, lint sem nada novo, **build de produção completo sem erros**. Validado em preview local (`localhost:3001`) contra o Firebase de dev (`ortega-e2e09`). Não subiu em lugar nenhum ainda.

> **Escopo:** a padronização do fluxo de agendamento (avançar/voltar, dia de outro mês, barra sticky) **saiu desta branch** — o Vitor já resolveu essa frente. O que sobrou aqui é o contador de clientes, o fix do contador visual e o safe-area do PWA.

---

## 🧭 Resumo em uma linha

A landing passa a mostrar o número **real** de clientes atendidos, sem custo de cota que cresça com o histórico — e o contador para de travar em zero no celular.

---

## 1. Número de clientes na landing — contador on-write

**Problema:** a landing mostrava `500+ clientes`, hardcoded e inventado. Contar de verdade na hora da visita significaria varrer `agendamentos` e deduplicar telefone — leitura proporcional ao histórico, na página mais acessada do site. Exatamente o padrão que estourou a cota em 22/07.

**Solução:** mesmo caminho do agregador de caixas — o número é mantido **on-write** e a landing só **lê 1 documento**.

### Novo — `src/lib/clientes-agg.ts`
```
meta/clientesAtendidos   → { total, atualizadoEm }
clientes_index/{hash}    → { primeiroEm }        (1 doc por telefone único)
```
- `lerTotalClientes()` — 1 leitura. Nunca lança: erro devolve 0 e a landing só esconde o stat.
- `registrarClienteAtendido(telefone)` — transação: se o doc de índice já existe, é cliente recorrente e o total não sobe. A transação existe porque dois atendimentos do mesmo telefone finalizados ao mesmo tempo poderiam ler "não existe" juntos e somar 2.
- `registrarClientePorAgendamento(id)` — mesma coisa partindo do agendamento (a comanda não guarda telefone).

**O id do índice é SHA-256 truncado, nunca o telefone em claro.** Id de documento é a parte mais exposta do Firestore; com o telefone cru, `clientes_index` seria uma lista raspável dos clientes do Igor — dado pessoal (LGPD). O hash dedupe igual.

### Pontos de escrita
- `src/app/api/agendamentos/[id]/route.ts` — status → `concluido`.
- `src/lib/comandas.ts` → `finalizarComanda` — comanda finalizada também conclui o agendamento vinculado.

Os dois caminhos se cruzam quando o admin conclui um agendamento que tem comanda aberta, então a rota **só registra quando não delegou pra `finalizarComanda`** — senão eram 3 leituras onde basta 1.

### Consumo (o ponto principal)
| | custo | por dia |
|---|---|---|
| Landing lendo o total | 1 leitura por revalidação do ISR (60s) | teto 1.440 (visita todo minuto, 24h); realista ~100–300 |
| Atendimento concluído | 1 leitura + 2 escritas só na 1ª vez do telefone | ~30 atendimentos → ~60 leituras |

**É constante — não cresce com o histórico.** Contar na hora custaria N leituras por revalidação com N crescendo pra sempre: com 10 mil concluídos, *uma visita* custaria 10 mil leituras.

### Backfill — `scripts/backfill-clientes-agg.mjs`
O contador começa do zero e ignoraria o histórico. O script varre `agendamentos` concluídos **uma única vez**, deduplica por telefone e grava total + índice. Dry-run por padrão, `--write` pra gravar. Idempotente (`set` do total absoluto, não `increment`).

⚠️ **Usa a mesma normalização E o mesmo hash do runtime.** Se divergirem, o mesmo cliente conta duas vezes. Estão comentados um no outro.

### Exibição — `src/components/landing/Sobre.tsx`
Arredonda pra baixo em dezenas (137 → `130+`) e **esconde o stat abaixo de 30**: "12+ clientes" joga contra. Com o stat escondido a régua vira 2 colunas.

---

## 2. Contador visual travado em zero

O `CountUp` renderizava uma `MotionValue` começando em 0 e só chegava no número real se a animação rodasse. No mobile ela travava: a landing mostrava `0+ clientes` com `5+ anos` e `100%` ao lado. Confirmado no HTML de produção — **o servidor entregava `0+ / 0+ / 0%`** e dependia inteiramente do JS.

Agora o valor final é o estado inicial (SSR e fallback corretos) e a animação é enfeite: só zera quando de fato vai contar, e sempre termina no alvo. Sem JS, com IntersectionObserver quebrado ou com `prefers-reduced-motion`, o número certo continua na tela.

Detalhe que quase passou: se a seção já estiver visível no load (tela alta, link direto pra `#sobre`), animar significaria pular do número certo pra 0 na cara do visitante. Nesse caso não anima.

---

## 3. Safe-area / PWA

WIP que estava no stash desde 20/07, junto da branch. Instalado como app (standalone) o conteúdo subia pra baixo do relógio/notch:

- navbar: `padding-top` de `env(safe-area-inset-top)`
- CTA flutuante do mobile: `padding-bottom` do inset + fundo sólido (vazava a página por trás)
- contato e status: topo passa a somar o inset
- hero: `min-w-0`/`shrink-0` e tracking menor no mobile — "Barbearia Premium" estourava a linha em tela estreita

`viewport.themeColor` faltava só no site público (`/admin` e `/barbeiro` já declaravam) — adicionado.

---

## 📁 Arquivos

**Novos:** `src/lib/clientes-agg.ts`, `scripts/backfill-clientes-agg.mjs`
**Alterados:** `src/app/(public)/page.tsx`, `src/components/landing/Sobre.tsx`, `src/app/api/agendamentos/[id]/route.ts`, `src/lib/comandas.ts`, `src/app/layout.tsx`
**Safe-area (do stash):** `Navbar.tsx`, `CtaMobileFloat.tsx`, `Hero.tsx`, `(public)/contato/page.tsx`, `agendamento/status/page.tsx`

`src/app/(public)/agendamento/page.tsx` **não é tocado por esta branch** — restaurado ao estado de `dev` pra não conflitar com o trabalho do Vitor.

---

## ⚠️ Pontos de atenção

1. **Backfill em produção ainda não rodou.** Sem ele o contador começa do zero e o stat de clientes fica escondido (< 30) — degrada bem, mas ignora todo o histórico do Igor.
   `DOTENV_PATH=.env.ortega-0907 node scripts/backfill-clientes-agg.mjs` (dry-run) e depois `--write`.
2. **Preview do Vercel aponta pro Firebase de PRODUÇÃO.** Revisar essa branch no preview mexe em dado real do Igor. Pra testar isolado, rodar local com `.env.local` (hoje em `ortega-e2e09`).
3. **Não existe `firestore.rules` no repositório** — `firebase.json` só tem emuladores. Como o app não usa Firestore client-side (o `db` de `lib/firebase.ts` está exportado mas nenhum componente usa; só `auth`), as regras poderiam ser deny-all. Vale versionar: hoje a proteção dos dados depende do que estiver no console e ninguém no time enxerga.
4. **PWA da landing não é instalável no Android.** O `sw.js` só é registrado pelos hooks de push do admin/barbeiro; sem service worker com fetch handler o Chrome não oferece o banner. No iOS o "Adicionar à Tela de Início" funciona. Bônus torto: esse SW se chama `ortega-admin-v1`, pré-cacheia `/admin` e registra com `scope: "/"` — quem é admin tem um SW de admin controlando a landing (network-first, não quebra nada).
5. **`maximumScale: 1, userScalable: false`** no root layout bloqueia pinch-zoom no site inteiro (WCAG 1.4.4). Pré-existente, decisão de produto — não mexi.
6. **"5+ anos" continua inventado** (a Ortega abriu em 2026). O Igor só apontou o número de clientes; não mexi por conta própria.

---

## 🧪 Como testar

```bash
git checkout feat/socio-pwa-manifest
npm run dev            # usa .env.local (ortega-e2e09, não é prod)
```

- **Landing** — a régua do "Sobre" tem que trazer o número **no HTML do servidor**, não depois da animação:
  `curl -s localhost:3000 | grep -A5 "Nossa hist"`
- Com o contador zerado (Firebase limpo), o stat de Clientes tem que **sumir** e a régua virar 2 colunas — não mostrar "0+".
- Concluir um atendimento no admin e conferir que `meta/clientesAtendidos.total` sobe **uma vez** por telefone novo, e não sobe pra telefone repetido.
- **Safe-area** — abrir instalado (standalone) num iPhone com notch: navbar e CTA flutuante não podem colidir com relógio/barra de gestos.
