# Contribuindo com o projeto Ortega

## Fluxo de trabalho

```
main          ← produção (deploy automático na Vercel) — nunca commitar direto
dev           ← integração — sempre partir daqui
feat/xxx      ← sua branch de feature
```

### Passo a passo

```bash
# 1. Sempre partir de dev atualizado
git checkout dev
git pull origin dev

# 2. Criar branch para a feature
git checkout -b feat/nome-da-feature

# 3. Desenvolver e commitar normalmente

# 4. Abrir PR: feat/xxx → dev
# O outro revisa e aprova antes de mergear

# 5. Quando dev estiver testado → PR: dev → main
```

PRs direto em `main` ou `dev` são bloqueados — é obrigatório passar por revisão.

---

## Divisão de responsabilidades

### Vitor
```
src/app/barbeiro/**                        portal do barbeiro
src/app/api/barbeiro/**                    APIs do portal
src/app/(public)/agendamento/**            fluxo de agendamento público
src/app/agendamento/status/**              status do agendamento
src/app/admin/(protected)/financeiro/**    financeiro admin
src/app/admin/(protected)/agendamentos/**  agendamentos admin
src/lib/agendamentos*.ts
src/lib/barbeiros*.ts
```

### Cardoso
```
src/app/admin/(protected)/auditoria/**     auditoria
src/app/admin/(protected)/produtos/**      produtos admin
src/app/api/admin/produtos/**              APIs de produtos
src/lib/admin-produtos.ts
src/components/landing/**                  landing page
src/app/(public)/page.tsx                  landing page (server component)
```

---

## Arquivo compartilhado — atenção

**`src/components/admin/AdminNav.tsx`** — qualquer alteração aqui deve ser comunicada antes de editar. É o único arquivo com risco real de conflito entre as duas áreas.

---

## Convenções de commit

```
feat: descrição da feature
fix: descrição do bug corrigido
refactor: mudança sem impacto de comportamento
```

---

## Setup inicial (Vitor)

```bash
git clone https://github.com/tecnosup/ortega.git
cd ortega
npm install
git checkout dev
git checkout -b feat/nome-da-feature
```

Copie o `.env.local` com o Cardoso — as variáveis de ambiente não estão no repo.
