<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Git Workflow — Regra obrigatória para todos os agentes

Este projeto tem **dois desenvolvedores trabalhando em paralelo**. Nunca commite ou faça push direto em `dev` ou `main` sem seguir o fluxo abaixo.

## Branches
- `main` → produção. Nunca commite direto aqui.
- `dev` → integração/testes. Só recebe merges de feature branches prontas.
- `feat/<nome>` → onde todo trabalho acontece.

## Fluxo obrigatório antes de qualquer tarefa de código

1. **Sempre comece sincronizando:**
   ```bash
   git checkout dev && git pull origin dev
   ```
2. **Crie ou mude para a branch da sua área:**
   ```bash
   git checkout -b feat/<sua-area>   # se ainda não existe
   # ou
   git checkout feat/<sua-area>      # se já existe
   ```
3. **Trabalhe e commite normalmente na sua branch.**
4. **Para integrar em dev:**
   ```bash
   git checkout dev && git pull origin dev
   git merge feat/<sua-area>
   git push origin dev
   ```
5. **Nunca faça merge em `main` sem testar o preview do Vercel (`dev`) primeiro.**

## Áreas de responsabilidade
- **Vitor:** financeiro, barbeiros → branch `feat/vitor-financeiro`, `feat/vitor-barbeiros`
- **Sócio:** auditoria e outras áreas → branch `feat/socio-auditoria` (ou nome adequado)

## Se você (agente) for fazer alterações de código
- Verifique em qual branch está com `git branch` antes de qualquer edit/write.
- Se estiver em `dev` ou `main`, mude para a branch correta antes de modificar arquivos.
- Nunca use `git push --force`.
