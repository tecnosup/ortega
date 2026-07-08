// Feature flags do Ortega — client-safe (sem imports server-only).
//
// Assinaturas + Área do cliente estão OCULTAS por enquanto: o Igor ainda não
// definiu como vai funcionar a cobrança. Para REATIVAR quando ele decidir,
// basta trocar para `true` e fazer o deploy — o código continua todo no repo.
export const ASSINATURAS_ATIVAS = false;

// Reviews/depoimentos ocultos por enquanto (08/07/2026). Trocar para `true` p/ reexibir.
export const REVIEWS_ATIVOS = false;
