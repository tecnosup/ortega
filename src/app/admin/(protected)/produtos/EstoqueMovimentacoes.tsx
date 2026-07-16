"use client";

import { useEffect, useState, useCallback } from "react";
import {
  IconAdjustmentsHorizontal, IconChevronDown, IconChevronUp, IconPlus, IconRotateClockwise2, IconShoppingBag, IconShoppingCart, IconTrendingUp,
} from "@tabler/icons-react";
import type { MovimentacaoEstoque, TipoMovimentacao } from "@/lib/estoque-movimentacoes-tipos";
import { TIPO_LABEL } from "@/lib/estoque-movimentacoes-tipos";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { useModalMount } from "@/components/ui/useModalMount";
import { useSucesso } from "@/components/ui/Sucesso";
import type { Produto } from "@/lib/admin-produtos";

const TIPOS: { key: TipoMovimentacao | "todos"; label: string }[] = [
  { key: "todos",         label: "Todos" },
  { key: "venda",         label: "Venda" },
  { key: "reposicao",     label: "Reposição" },
  { key: "devolucao",     label: "Devolução" },
  { key: "ajuste_manual", label: "Ajuste Manual" },
];

const TIPO_COR: Record<TipoMovimentacao, string> = {
  venda:         "text-[#b8944a]",
  reposicao:     "text-green-400",
  devolucao:     "text-blue-400",
  ajuste_manual: "text-gray-400",
};

const TIPO_BADGE: Record<TipoMovimentacao, { icon: React.ReactNode; bg: string; border: string }> = {
  venda:         { icon: <IconShoppingCart size={9} />,      bg: "bg-[#b8944a]",   border: "border-yellow-900" },
  reposicao:     { icon: <IconTrendingUp size={9} />,        bg: "bg-green-500",   border: "border-green-900" },
  devolucao:     { icon: <IconRotateClockwise2 size={9} />,         bg: "bg-blue-500",    border: "border-blue-900" },
  ajuste_manual: { icon: <IconAdjustmentsHorizontal size={9} />, bg: "bg-gray-600",    border: "border-gray-800" },
};

function formatData(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR");
}

function NovaMovimentacaoModal({
  open,
  produtos,
  onSalvar,
  onFechar,
}: {
  open: boolean;
  produtos: Produto[];
  onSalvar: () => void;
  onFechar: () => void;
}) {
  const [produtoId, setProdutoId] = useState(produtos[0]?.id ?? "");
  const [tipo, setTipo] = useState<TipoMovimentacao>("reposicao");
  const [quantidade, setQuantidade] = useState("");
  const [obs, setObs] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function salvar() {
    if (!produtoId || !quantidade || isNaN(Number(quantidade)) || Number(quantidade) === 0) {
      setErro("Produto e quantidade são obrigatórios"); return;
    }
    setSalvando(true);
    const produto = produtos.find((p) => p.id === produtoId);
    const qtd = tipo === "venda" ? -Math.abs(Number(quantidade)) : Math.abs(Number(quantidade));
    await fetch("/api/admin/estoque-movimentacoes", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        produtoId,
        produtoNome: produto?.titulo ?? "",
        produtoImagem: produto?.imagem,
        tipo,
        quantidade: qtd,
        obs: obs.trim() || undefined,
      }),
    });
    setSalvando(false);
    onSalvar();
  }

  const inp = "w-full bg-[#0A0A0A] border border-[#2d2d2d] rounded-lg px-3 py-2.5 text-sm text-[#F5E6C8] focus:outline-none focus:border-[#b8944a] transition";

  return (
    <Modal open={open} onClose={onFechar} className="bg-[#111] border border-[#2d2d2d] rounded-xl w-full max-w-md mx-4 flex flex-col shadow-2xl">
        <div className="flex items-center px-5 py-4 border-b border-[#1e1e1e]">
          <h3 className="font-bold text-[#F5E6C8] text-sm tracking-wide">Nova movimentação</h3>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          {erro && <p className="text-xs text-red-400 bg-red-900/10 border border-red-900/30 rounded px-3 py-2">{erro}</p>}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">Produto</label>
            {/* searchable: nomes de produto são longos e a lista cresce — buscar é
                mais rápido que rolar. */}
            <Select
              value={produtoId}
              onChange={setProdutoId}
              options={produtos.map((p) => ({ value: p.id, label: p.titulo }))}
              placeholder="Selecionar produto"
              searchable
              searchPlaceholder="Buscar produto..."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">Tipo</label>
            <div className="flex gap-2 flex-wrap">
              {TIPOS.filter((t) => t.key !== "todos").map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTipo(t.key as TipoMovimentacao)}
                  className={`px-3 py-1.5 text-xs rounded border transition ${
                    tipo === t.key
                      ? "border-[#b8944a] text-[#b8944a] bg-[#b8944a]/10"
                      : "border-[#2d2d2d] text-gray-500 hover:border-[#444]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">
              Quantidade {tipo === "venda" ? "(saída)" : "(entrada)"}
            </label>
            <input
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="0"
              className={inp}
              style={{ fontSize: 16 }} spellCheck={false}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">Observação (opcional)</label>
            <input
              type="text"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Ex: Venda no caixa, Reposição fornecedor..."
              className={inp}
              style={{ fontSize: 16 }} spellCheck={false}
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#1e1e1e] flex gap-2">
          <button
            onClick={salvar}
            disabled={salvando}
            className="flex-1 py-2.5 bg-[#b8944a] text-[#0A0A0A] text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-[#c9a84c] transition disabled:opacity-50"
          >
            {salvando ? "Registrando..." : "Registrar"}
          </button>
          <button onClick={onFechar} className="px-5 py-2.5 border border-[#2d2d2d] text-gray-400 text-xs rounded-lg hover:border-[#b8944a] transition">
            Cancelar
          </button>
        </div>
    </Modal>
  );
}

// Quantas movimentações ficam SEMPRE visíveis. Passando disso, o excedente fica
// recolhido num card "ver mais N" que expande (e "recolher" volta ao limite).
const LIMITE_VISIVEL = 3;

export default function EstoqueMovimentacoes({ produtos }: { produtos: Produto[] }) {
  const sucesso = useSucesso();
  const [movs, setMovs] = useState<MovimentacaoEstoque[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<TipoMovimentacao | "todos">("todos");
  const [expandido, setExpandido] = useState(false); // excedente recolhido por padrão
  const [modalAberto, setModalAberto] = useState(false);
  const movMount = useModalMount(modalAberto ? true : null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const res = await fetch("/api/admin/estoque-movimentacoes", { credentials: "include" });
    if (res.ok) setMovs(await res.json());
    setCarregando(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const filtrados = filtro === "todos" ? movs : movs.filter((m) => m.tipo === filtro);
  // sempre mostra as LIMITE_VISIVEL mais recentes; o resto só quando expandido
  const exibidos = expandido ? filtrados : filtrados.slice(0, LIMITE_VISIVEL);
  const excedente = filtrados.length - LIMITE_VISIVEL;

  return (
    <>
      {movMount.mounted && (
        <NovaMovimentacaoModal
          key={movMount.key}
          open={movMount.open}
          produtos={produtos}
          onSalvar={() => { setModalAberto(false); sucesso("Movimentação registrada!"); carregar(); }}
          onFechar={() => setModalAberto(false)}
        />
      )}

      <div className="border border-[#2d2d2d] rounded-lg overflow-hidden">
        {/* Cabeçalho */}
        {/* Título e contador empilhados: lado a lado eles somam mais que a largura
            do celular e brigavam com o botão. min-w-0 no bloco + shrink-0 no botão
            garantem que quem cede espaço é o texto, nunca a ação. */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 bg-[#111] border-b border-[#2d2d2d]">
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-widest uppercase text-[#F5E6C8] leading-tight">
              Movimentações de Estoque
            </p>
            <p className="text-[10px] text-gray-600 tracking-widest uppercase mt-1">
              {movs.length} registro{movs.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setModalAberto(true)}
            className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase text-[#0A0A0A] bg-[#b8944a] rounded hover:bg-[#c9a84c] transition"
          >
            <IconPlus size={11} /> Registrar
          </button>
        </div>

        {/* Filtros em pílula — mesmo padrão do filtro de status em /admin/itens.
            Eram abas, mas as 5 somam ~490px contra ~335px de tela no celular: em
            uma linha vazavam, e aba não sobrevive a quebra de linha (sobra borda
            lateral solta e célula vazia, parece defeito). Pílula é feita pra fluir. */}
        <div className="flex flex-wrap gap-1.5 px-5 py-3 bg-[#0d0d0d] border-b border-[#2d2d2d]">
          {TIPOS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setFiltro(t.key); setExpandido(false); }}
              className={`px-3 py-1 text-xs rounded-full border whitespace-nowrap transition ${
                filtro === t.key
                  ? "border-[#b8944a] text-[#b8944a] bg-[#b8944a]/10"
                  : "border-[#2d2d2d] text-gray-500 hover:border-[#444] hover:text-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Lista — sempre mostra as mais recentes (até LIMITE_VISIVEL); o resto expande */}
        <div className="bg-[#0A0A0A]">
          {carregando ? (
            <p className="text-xs text-gray-600 text-center py-10">Carregando...</p>
          ) : filtrados.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-10">Nenhuma movimentação registrada.</p>
          ) : (
            <>
              {exibidos.map((m) => {
                const badge = TIPO_BADGE[m.tipo];
                return (
                <div key={m.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-[#1a1a1a] last:border-0 hover:bg-[#111] transition">
                  {/* Produto + badge de tipo */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-lg border border-[#2d2d2d] overflow-hidden bg-[#111] flex items-center justify-center">
                      {m.produtoImagem ? (
                        <img src={m.produtoImagem} alt={m.produtoNome} className="w-full h-full object-cover" />
                      ) : (
                        <IconShoppingBag size={15} className="text-gray-600" />
                      )}
                    </div>
                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white border ${badge.bg} ${badge.border}`}>
                      {badge.icon}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F5E6C8] truncate">{m.produtoNome}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${TIPO_COR[m.tipo]}`}>
                        {TIPO_LABEL[m.tipo]}
                      </span>
                      {m.obs && <span className="text-[10px] text-gray-600 truncate">· {m.obs}</span>}
                    </div>
                  </div>

                  {/* Quantidade + data */}
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold tabular-nums ${TIPO_COR[m.tipo]}`}>
                      {m.quantidade > 0 ? "+" : ""}{m.quantidade}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{formatData(m.criadoEm)}</p>
                  </div>
                </div>
                );
              })}

              {/* card colapsável do excedente */}
              {excedente > 0 && (
                <button
                  onClick={() => setExpandido((v) => !v)}
                  className="w-full flex items-center justify-center gap-1.5 py-3 text-[10px] font-bold tracking-widest uppercase text-gray-500 hover:text-[#b8944a] hover:bg-[#111] transition border-t border-[#1a1a1a]"
                >
                  {expandido
                    ? <><IconChevronUp size={13} /> Recolher</>
                    : <><IconChevronDown size={13} /> Ver mais {excedente} movimentaç{excedente !== 1 ? "ões" : "ão"}</>}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
