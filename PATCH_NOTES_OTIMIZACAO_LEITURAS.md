# Otimização de cota (leituras do Firestore) — notas da atualização

**Branch:** `feat/socio-otimizacao-leituras`
**Status:** commitada, build limpo — aguardando validação antes de `dev`/prod

---

## 🛠️ Versão técnica — para revisão com o Vitor

### O problema

Depois que o agregador (`meta/caixasAbertos`) resolveu o custo do polling, sobrou um gargalo **maior e menos visível**: três funções de listagem liam a **coleção inteira**, sem `limit` e sem filtro de data.

| Função | Arquivo |
|---|---|
| `listarAgendamentos()` | `src/lib/agendamentos.ts` |
| `listarFechamentos()` | `src/lib/agendamentos.ts` |
| `listarComandas()` | `src/lib/comandas.ts` |

Elas alimentam as telas mais usadas do dia a dia — **Dashboard, Agendamentos, Caixa e Comissões**. O resultado: o custo de abrir uma tela era proporcional ao **histórico inteiro**, não ao que a tela mostra.

> O ponto central: **cada agendamento novo encarecia toda navegação futura.** O consumo subia sozinho, todo dia, mesmo sem aumentar o movimento da barbearia. É por isso que a sensação era de estar caminhando pro teto.

Três rotas ainda pagavam a coleção toda pra devolver **um único dia**:

- `GET /api/agendamentos?data=X` — lia tudo e filtrava **em memória**
- `POST /api/fechamento` — lia todos os agendamentos + todos os fechamentos pra fechar 1 dia
- `POST /api/comandas/[id]/reabrir` — lia todos os fechamentos pra checar 1 dia

### O que mudou

Filtro passou a acontecer **no servidor**:

- `listarAgendamentos` / `listarComandas` aceitam janela `{ de, ate, limite }`
- `listarFechamentos` limita a 180 docs (~6 meses) por padrão; `limite: 0` traz tudo
- Novas `listarAgendamentosPorData()` e `getFechamentoPorData()` para lookup de 1 dia
- Novos helpers `diasAtras()` / `diasAFrente()` em `date-utils`, ancorados em `hojeBR()` (fuso de SP — servidor da Vercel em UTC não pode adiantar o dia)
- Comissões passou a pedir só o período dos filtros (`?de=&ate=`), com `inicio`/`fim` nas dependências do `useCallback`

Janela padrão: **90 dias**.

### Detalhe importante — agendamentos futuros

A janela padrão é só `data >= corte`, **sem corte superior**. Um filtro ingênuo de "últimos 90 dias" teria escondido os agendamentos **futuros** — que são justamente os que importam na agenda e no calendário. Isso foi tratado de propósito.

### Sobre índices

As queries usam range + `orderBy` no **mesmo campo** (`data`), o que o Firestore serve com o **índice automático de campo único**. **Nenhum índice composto novo é necessário** — ou seja, nada a deployar no console antes de subir.

Isso foi **validado rodando as 5 queries contra um Firestore real** (projeto de dev), não deduzido: todas passaram sem `FAILED_PRECONDITION`.

### Verificação

- `npx tsc --noEmit` — limpo
- `npx next build` — limpo
- 5 formatos de query validados contra Firestore real

### O que **não** foi medido

Tentei contar os docs de produção via `.count()` (agregação, custa ~1 leitura) pra estimar o ganho em número absoluto, mas **o comando foi bloqueado pelo classificador de permissão** do ambiente. Então o ganho aqui está descrito de forma **estrutural** (custo deixa de crescer com o histórico), sem percentual medido. Se quiser o número exato, é só liberar que eu rodo — é read-only.

### Ponto de atenção pra validação

A tela de **Caixa** agora carrega 90 dias de comandas. Comandas em aberto mais antigas que isso não apareceriam na lista — na prática o agregador de caixas abertos também retém 90 dias, então as duas janelas coincidem e um caixa aberto não fica "alertado porém invisível". Vale confirmar no uso real.

---

## 💬 Versão simples — para o Igor

**O que era:** cada vez que uma tela do painel abria, o sistema lia **todo o histórico** da barbearia — todos os agendamentos, todas as comandas, desde o começo. Só pra mostrar a tela do dia.

**Por que isso é um problema:** quanto mais a barbearia trabalha, mais pesado o sistema fica. O gasto cresce **sozinho**, todo dia, mesmo que o movimento seja o mesmo. Era o que estava empurrando a conta pro limite do plano gratuito.

**O que mudou:** agora o sistema lê **só o período que a tela mostra**. Abrir o painel custa o mesmo hoje e daqui a dois anos — o gasto parou de crescer junto com o histórico.

**Muda alguma coisa no uso?** Não. Mesmas telas, mesmas informações, e os agendamentos futuros continuam todos aparecendo normalmente na agenda.

**Precisa fazer algo?** Não. Nenhuma mudança no Firebase, nenhuma configuração — é só código.
