---
# STATUS — Ortega Melhorias
## Branch
feat/socio-melhorias
## Blocos
- [x] Bloco 1 — Bug fix upload vitrine
- [x] Bloco 2 — Estoque em produtos
- [x] Bloco 3 — Fluxo de compra na landing
- [x] Bloco 4 — Funcionários (coordenar com Vitor antes)
## Observações
Bloco 1: ProdutoForm.tsx usava lógica antiga de Cloudinary (GET para assinatura + XHR para api.cloudinary.com). A API /api/admin/upload só suporta POST direto para R2. Corrigido para usar POST com FormData, igual ao padrão de itens/novo/page.tsx.
---
