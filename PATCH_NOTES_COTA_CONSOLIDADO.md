# Otimização de cota do Firestore — consolidado

**Contexto:** em 22/07 o projeto estourou a cota gratuita do Firestore (`RESOURCE_EXHAUSTED`) e o painel começou a falhar em produção. Este documento reúne as **5 frentes** de otimização feitas desde então, o que cada uma resolveu e o que ficou de fora.

**Status:** tudo em produção (`ortega.vercel.app`).

---

## Resumo das frentes

| # | Frente | Problema | Ganho |
|---|---|---|---|
| 1 | Polling 30s → 90s | Painel consultava a cada 30s | ~3x menos chamadas |
| 2 | Agregador de caixas abertos | ~1.100 docs lidos por polling | ~99% no polling |
| 3 | Poda do agregador (90d) | Doc cresceria até o teto de 1 MiB | Evita falha silenciosa |
| 4 | Polling do fluxo público | Pico de leituras no agendamento | Corta pico |
| 5 | Janela de data + recarga por clique | Varredura de coleções inteiras | Custo deixa de crescer |

---

## 1. Polling do admin: 30s → 90s
`caf492c`

O `useAdminNotificacoes` consultava `/api/admin/notificacoes` a cada 30s, por aba aberta. Passou para 90s.

Ficou também: **polling só com a aba visível** (`visibilitychange`) — aba em segundo plano não consome mais nada.

Notificação de agendamento novo chega em até 90s, imperceptível na operação.

---

## 2. Agregador de caixas abertos
`223e3f9`, `ddfa28a` — `src/lib/caixas-abertos-agg.ts`

**Este era o gargalo que estourou a cota.**

O painel precisa saber quais dias têm comanda finalizada **sem** fechamento de caixa. A cada polling isso lia ~1.000 comandas (30d) + ~100 fechamentos — só pra extrair uma lista de datas.

Trocado por **um doc agregador** (`meta/caixasAbertos`), mantido *on-write* quando comanda finaliza/reabre/cancela ou fechamento é criado/excluído.

**~1.100 leituras → 1 leitura por polling.** O custo migrou de milhares de leituras/dia para dezenas de escritas/dia.

---

## 3. Poda do agregador
`cc2d4d6`

O mapa `dias` do agregador cresceria pra sempre e um dia estouraria o **teto de 1 MiB por documento** do Firestore — o agregador congelaria **silenciosamente**, sem erro visível.

Retenção de 90 dias com poda automática. Correção preventiva: o bug ainda não tinha acontecido.

---

## 4. Polling do fluxo público de agendamento
`b08dc32`

O fluxo público (`/agendamento`) tinha polling agressivo, multiplicado por **cada visitante simultâneo** — diferente do admin, que é ~1 usuário. Aliviado para cortar o pico.

---

## 5. Janela de data + recarga por clique
`3d6c82d`, `7e50b23` — a frente mais recente

### 5a. Varredura de coleções inteiras

Três funções liam a coleção **inteira**, sem `limit` e sem filtro:

- `listarAgendamentos()` e `listarFechamentos()` — `src/lib/agendamentos.ts`
- `listarComandas()` — `src/lib/comandas.ts`

Elas alimentam Dashboard, Agendamentos, Caixa e Comissões. **O custo por tela era proporcional ao histórico inteiro** — cada agendamento novo encarecia toda navegação futura.

Três rotas pagavam a coleção toda pra devolver **um único dia**:
- `GET /api/agendamentos?data=` filtrava **em memória**
- `POST /api/fechamento` lia todos os ags + todos os fechamentos
- `POST /api/comandas/[id]/reabrir` lia todos os fechamentos

**Correção:** filtro no servidor via janela `{de, ate, limite}` (padrão 90d), `listarFechamentos` limitado a 180 docs, e novas `listarAgendamentosPorData()` / `getFechamentoPorData()` para lookup de 1 dia.

**Agendamentos futuros:** a janela é só `data >= corte`, **sem corte superior**. Um filtro ingênuo de "últimos 90 dias" teria sumido com os agendamentos futuros — tratado de propósito.

**Índices:** as queries usam range + `orderBy` no **mesmo campo** (`data`), servidas pelo índice automático de campo único. **Nenhum índice composto novo.** Validado rodando as 5 formas de query contra um Firestore real (projeto de dev).

### 5b. Recarga a cada troca de dia

O console do Firestore mostrou `/agendamentos` com **7.272 leituras (~60% do total)** numa coleção de **~136 docs** — dezenas de varreduras completas.

Causa: na tela de Agendamentos, `dataSelecionada` estava na dep list de um `carregar` único que buscava agendamentos + fechamentos + slots **juntos**. Mas só os **slots** dependem do dia. Cada clique num dia relia 136 agendamentos + 943 fechamentos **à toa** — e essa é a tela mais usada.

**Correção:**
- agendamentos + fechamentos → carregam na montagem (e após criar/reagendar)
- slots bloqueados → efeito separado, só isso refaz ao trocar de dia
- `caixaFechado` → derivado dos fechamentos já em memória, sem fetch extra

Onde antes 20 cliques = 20 varreduras, agora = 1.

---

## Como interpretar o resultado

As frentes têm naturezas diferentes:

- **2 e 5b** cortam volume **imediato** — são as de maior impacto direto
- **5a** quase não muda o número hoje (a base tem ~136 agendamentos, quase toda dentro da janela de 90d), mas **impede o crescimento**: sem ela, o consumo subiria sozinho conforme o histórico crescesse, mesmo com movimento constante
- **3** é preventiva: não reduz nada, evita uma falha silenciosa futura

**Não espere o gráfico despencar de um dia pro outro por causa da 5a.** O sinal de sucesso é o consumo ficar **estável** ao longo das semanas em vez de subir.

---

## O que ficou de fora

- **Contagem real dos docs em produção** — tentei `.count()` (agregação, ~1 leitura) pra quantificar o ganho em número absoluto, mas o comando foi bloqueado pelo classificador de permissão do ambiente. Os ganhos aqui são descritos de forma estrutural ou a partir do console do Firebase, sem percentual medido por mim.
- **Rotas menores** (`/api/gastos`, `/api/slots`) — ainda não auditadas; hoje aparecem baixas no console.
- **Reduzir a janela de 90 → 30 dias** — cortaria mais, mas o Igor perderia histórico visível no Caixa. Não vale sem necessidade.

---

## Ponto de atenção

A tela de **Caixa** carrega 90 dias de comandas. O agregador de caixas abertos também retém 90 dias, então as janelas coincidem — um caixa aberto não fica "alertado porém invisível". Se aparecer necessidade de histórico mais longo, é um número em uma linha.

---

## Verificação

- `npx tsc --noEmit` — limpo
- `npx next build` — limpo (warnings pré-existentes, não relacionados)
- Queries validadas contra Firestore real
- Produção validada após deploy: 136 registros, 5 agendamentos futuros preservados
