# Otimização de cota do Firebase — notas da atualização

**Branch:** `feat/socio-otimizacao-cota`
**Contexto:** 22/07 o site do Igor caiu com `RESOURCE_EXHAUSTED: Quota exceeded` (estourou o limite diário de 50.000 leituras do plano gratuito do Firestore).
**Status:** validado local (typecheck + build + testes no emulador). Aguardando billing do Igor + validação antes de `dev`/prod.

---

## 🧭 Resumo em uma linha

O painel admin lia **~1.100 documentos a cada 90 segundos, por aba aberta**, só pra calcular "quantos caixas retroativos estão abertos". Trocamos isso por **1 leitura**. É o que estourava a cota.

---

## 🔴 O que estava acontecendo (a causa)

O painel admin faz *polling*: a cada 90s, a tela chama `/api/admin/notificacoes` pra atualizar os badges (agendamentos pendentes, caixas abertos, vencimentos). Esse endpoint tinha esta query:

```js
db.collection("comandas")
  .where("data", ">=", limite30dStr)   // últimos 30 dias
  .where("data", "<", hoje)
  .limit(1000)                          // ATÉ MIL documentos
  .get();
```

Ela lia **até 1.000 comandas** (mais ~100 fechamentos) **toda vez**, só pra descobrir uma listinha: "quais dias têm comanda finalizada mas não têm fechamento de caixa". Ou seja: gastava ~1.100 leituras pra produzir um número pequeno.

**Por que isso estoura a cota:** o custo se multiplica por tudo ao mesmo tempo —
`~1.100 leituras × (86.400s/dia ÷ 90s) × nº de abas admin abertas`.
Com o Igor operando o dia inteiro, e às vezes com mais de uma aba/dispositivo aberto, isso sozinho passa fácil das 50.000 leituras/dia gratuitas. Quando estoura, o Firestore para de responder e **o sistema cai até a meia-noite** (horário do Pacífico) — foi o que aconteceu no dia 22.

---

## 🟢 O que foi feito (a solução)

Em vez de **recalcular** a lista de caixas abertos varrendo 30 dias a cada 90s, agora mantemos um **placar pronto** (um "agregador") que é atualizado só quando algo realmente muda.

### 1. Novo agregador — `src/lib/caixas-abertos-agg.ts`
Um único documento no Firestore (`meta/caixasAbertos`) guarda, por dia, duas flags: "tem comanda finalizada?" e "tem fechamento?". Um dia está **aberto** quando tem comanda finalizada **e** não tem fechamento.

- `lerCaixasAbertos()` — o polling agora chama isto: **1 leitura**, devolve a lista pronta.
- `marcarComandaFinalizada()` / `marcarFechamentoCriado()` / `marcarFechamentoExcluido()` — atualizam o placar (1 escrita cada).
- `reconciliarDia()` — quando uma comanda é **reaberta/cancelada**, o dia pode ter perdido a última comanda finalizada; aí conferimos **só aquele dia** (poucos docs), não os 30 dias.

### 2. Os pontos de escrita foram ligados ao agregador
Onde o estado realmente muda, o placar é atualizado — na camada de dados, então vale pra qualquer tela que chame essas funções:
- `finalizarComanda` → marca o dia como "tem faturamento" — `src/lib/comandas.ts`
- `reabrirComanda` / `cancelarComanda` → reconciliam o dia — `src/lib/comandas.ts`
- `fecharCaixaDia` → marca o dia como "fechado" — `src/lib/agendamentos.ts`
- `excluirFechamento` → marca o dia como "reaberto" — `src/lib/agendamentos.ts`

### 3. O consumidor foi trocado — `src/app/api/admin/notificacoes/route.ts`
As duas queries pesadas (comandas 30d + fechamentos 30d) saíram. Entrou **uma** leitura do agregador. O resto do endpoint (pendentes, vencimentos) ficou igual.

### 4. Script de seed — `scripts/seed-caixas-abertos-agg.mjs`
O placar começa vazio. Este script roda **uma vez** e preenche o estado atual (a partir das comandas/fechamentos dos últimos 30 dias), pra não mostrar "0 caixas abertos" indevidamente logo após subir. Tem dry-run por padrão e `--write` pra gravar.

---

## ✅ Por que vai funcionar (e por que é seguro)

- **O resultado é idêntico ao de antes.** A regra de "caixa aberto" não mudou (comanda finalizada sem fechamento). Só trocamos *recalcular toda hora* por *manter um placar atualizado nos eventos*.
- **Testado no emulador (sem tocar em produção)** — 7 cenários cobrindo o ciclo completo, todos passaram:
  - finalizar comanda → dia abre ✅
  - fechar caixa → dia some ✅
  - excluir fechamento → dia reabre ✅
  - reabrir a última comanda do dia → dia some ✅
  - dia fora dos 30 dias → ignorado ✅
  - dia de hoje → não conta como retroativo ✅
- **É à prova de falha:** se o agregador falhar ao atualizar, ele nunca derruba a operação de negócio (finalizar comanda/fechar caixa continuam funcionando) — e o `seed` pode reconstruir o placar a qualquer momento.
- **Typecheck limpo + build de produção compilando** (`✓ Compiled successfully`).

### Impacto na cota
| | Antes | Depois |
|---|---|---|
| Leituras por polling (bloco caixas) | ~1.100 | **1** |
| Custo por dia (1 aba, 90s) | dezenas de milhares | centenas |

Redução de **~99%** nas leituras desse bloco — que era o maior consumidor e o que estourou o limite.

---

## ⚠️ Importante — billing continua recomendado

Esta otimização remove o **principal** dreno de cota, mas o billing (plano Blaze) segue sendo a rede de segurança certa: garante que o sistema **nunca mais caia por limite**, e o custo real do volume da barbearia é de centavos a poucos reais/mês. Otimização + billing juntos = sistema estável e barato.

---

## 📋 Passo a passo pra subir (quando validado)

1. Igor ativa o Blaze (destrava a produção imediatamente).
2. Merge `feat/socio-otimizacao-cota` → `dev` → validar preview.
3. **Rodar o seed uma vez em produção:**
   `DOTENV_PATH=.env.ortega-0907 node scripts/seed-caixas-abertos-agg.mjs --write`
4. Deploy prod (`vercel --prod --yes`, conta tecnosup).
5. Conferir no painel que o número de "caixas abertos" bate com o esperado.
