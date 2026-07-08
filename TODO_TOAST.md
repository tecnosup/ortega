# TODO: espalhar toast de feedback pelo resto do admin

Sistema de feedback consistente. Toda ação de **confirmar / editar / cancelar / excluir**
deve disparar um toast. Infra já pronta em `src/components/ui/Toast.tsx` (montada no
layout admin, vale em todas as telas).

## Como aplicar (padrão)

Em cada tela/componente:

```tsx
import { useToast } from "@/components/ui/Toast";

// dentro do componente:
const toast = useToast();

// nos handlers, DEPOIS do fetch dar certo:
toast.sucesso("Barbeiro cadastrado!");   // criar/editar/salvar
toast.info("Cupom removido");            // excluir/cancelar/desativar
toast.erro("Não foi possível salvar");   // quando o fetch falhar (res.ok === false)
```

Mensagens curtas, no passado, com "!" no sucesso. Já feito assim em
`financeiro/page.tsx` e `produtos/CategoriasInline.tsx` — copiar o estilo de lá.

## Já feito ✅
- `components/ui/Toast.tsx` (infra), `layout.tsx` (provider)
- `components/admin/CaixaCalendario.tsx`, `components/admin/AdminFab.tsx`
- `financeiro/page.tsx` (gastos, pagamento, categorias)
- `produtos/CategoriasInline.tsx`, `produtos/EstoqueMovimentacoes.tsx`

## Falta fazer ⬜ (ação CRUD real)

- [ ] `barbeiros/page.tsx` — criar / editar / excluir / ativar-desativar barbeiro
- [ ] `cupons/page.tsx` — criar / excluir cupom
- [ ] `descontos/DeleteDescontoButton.tsx` — excluir desconto
- [ ] `itens/page.tsx` — toggle publicar / reordenar serviço
- [ ] `itens/DeleteButton.tsx` — excluir serviço
- [ ] `vitrine/page.tsx` — salvar textos / toggles (tem `PATCH`)
- [ ] `agendamentos/page.tsx` — confirmar / concluir / cancelar / reagendar / editar
      (já mostra WhatsApp em alguns; adicionar toast de sucesso nas transições de status)

## Ignorar (não é CRUD clássico) 🚫
- `components/admin/AdminNav.tsx` — só logout
- `itens/novo/page.tsx`, `itens/[id]/editar/page.tsx`, `components/admin/ItemForm.tsx`
  — usam server action (`useActionState`) + redirect; feedback vem do redirect.
  O `fetch POST` nesses arquivos é só upload de imagem (já tem erro inline).
- `produtos/ProdutoForm.tsx` — idem (server action + upload com erro inline)

## Verificar ao final
```
npx tsc --noEmit          # deve passar limpo
npm run dev:emulator      # testar clicando: criar/excluir e ver o toast aparecer
```
Não rodar `npm run build` com o dev no ar (corrompe .next → tela branca; se acontecer:
matar o dev, `rm -rf .next`, subir de novo).
