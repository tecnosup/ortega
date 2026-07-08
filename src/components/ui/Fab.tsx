"use client";

import { AnimatePresence, motion, useMotionValue, animate } from "framer-motion";
import {
  IconPlus,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import type { Icon as LucideIcon } from "@tabler/icons-react";
import { useScrollLock } from "./useScrollLock";

export interface FabAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

type Lado = "left" | "right";

const FAB = 56;      // largura/altura do botão (px, = w-14/h-14)
const MARGEM = 20;   // left-5 / right-5 (1.25rem)
const BASE = "calc(env(safe-area-inset-bottom) + 5rem)"; // altura do botão a partir da base

/**
 * Botão flutuante (+) que gira ao abrir e revela ações em leque.
 *
 * Arrastável na horizontal (quando fechado): preso à tela, e ao soltar desliza
 * suave pro canto — passou da metade da tela vai pra esquerda, senão direita.
 * O lado é lembrado em localStorage. Abrir só com toque; arrastar não abre.
 *
 * O botão fica SEMPRE ancorado à esquerda e anda via `x` (0..D) — sem trocar
 * âncora, o que evita "pulos". As pílulas ficam numa camada separada, alinhadas
 * ao canto atual.
 */
export default function Fab({ actions }: { actions: FabAction[] }) {
  const [open, setOpen] = useState(false);
  const [lado, setLado] = useState<Lado>("right");
  const [larguraTela, setLarguraTela] = useState(0);
  const x = useMotionValue(0);
  const arrastou = useRef(false);       // bloqueia "abrir" quando foi arraste
  const pulaPin = useRef(false);        // pula o reposicionamento automático logo após um arraste

  // distância percorrível entre os cantos
  const D = Math.max(0, larguraTela - FAB - MARGEM * 2);

  // recupera o lado salvo
  useEffect(() => {
    const salvo = localStorage.getItem("fab-lado");
    if (salvo === "left" || salvo === "right") setLado(salvo);
  }, []);

  // acompanha a largura da tela
  useEffect(() => {
    const upd = () => setLarguraTela(window.innerWidth);
    upd();
    window.addEventListener("resize", upd);
    return () => window.removeEventListener("resize", upd);
  }, []);

  // fixa o botão no canto certo (carga inicial, resize, troca de lado) — exceto
  // logo após um arraste, quando quem manda é o spring do onDragEnd.
  useEffect(() => {
    if (pulaPin.current) { pulaPin.current = false; return; }
    x.set(lado === "right" ? D : 0);
  }, [lado, D, x]);

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function run(fn: () => void) {
    setOpen(false);
    fn();
  }

  function aoSoltar(_: unknown, info: { point: { x: number } }) {
    const paraDireita = info.point.x >= window.innerWidth / 2;
    const alvo = paraDireita ? D : 0;
    const novoLado: Lado = paraDireita ? "right" : "left";
    if (novoLado !== lado) {
      pulaPin.current = true;               // não deixa o efeito "teleportar" o botão
      setLado(novoLado);
      localStorage.setItem("fab-lado", novoLado);
    }
    animate(x, alvo, { type: "spring", stiffness: 500, damping: 42 });
  }

  const pillCls = lado === "right"
    ? "flex items-center gap-3 pl-4 pr-1.5 py-1.5"
    : "flex flex-row-reverse items-center gap-3 pr-4 pl-1.5 py-1.5";

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>

      {/* pílulas de ação — camada própria, ancorada ao canto atual, acima do botão */}
      <AnimatePresence>
        {open && (
          <div
            className={`fixed z-50 flex flex-col gap-3 ${lado === "right" ? "right-5 items-end" : "left-5 items-start"}`}
            style={{ bottom: `calc(${BASE} + ${FAB}px + 0.75rem)` }}
          >
            {actions.map((a, i) => {
              const Icon = a.icon;
              const delay = (actions.length - 1 - i) * 0.04;
              return (
                <motion.button
                  key={a.label}
                  onClick={() => run(a.onClick)}
                  className={`${pillCls} rounded-full bg-[#1a1a1a] border border-[#2d2d2d] shadow-lg hover:border-[#b8944a]/50 transition-colors`}
                  initial={{ opacity: 0, y: 12, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: { delay } }}
                  exit={{ opacity: 0, y: 12, scale: 0.9, transition: { delay } }}
                >
                  <span className="text-sm font-medium text-[#F5E6C8] whitespace-nowrap">{a.label}</span>
                  <span className="w-8 h-8 rounded-full bg-[#b8944a]/15 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-[#b8944a]" />
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* botão principal + / × — ancorado à esquerda, posição via x (0..D) */}
      <motion.button
        onPointerDown={() => { arrastou.current = false; }}
        onClick={() => { if (arrastou.current) return; setOpen((v) => !v); }}
        aria-label={open ? "Fechar menu" : "Abrir menu de ações"}
        className="fixed left-5 z-50 w-14 h-14 rounded-full bg-[#b8944a] text-[#0A0A0A] shadow-xl flex items-center justify-center hover:bg-[#c9a84c] transition-colors touch-none"
        style={{ x, bottom: BASE }}
        drag={open ? false : "x"}
        dragConstraints={{ left: 0, right: D }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={() => { arrastou.current = true; }}
        onDragEnd={aoSoltar}
        whileDrag={{ scale: 1.1, cursor: "grabbing" }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, rotate: open ? 135 : 0 }}
        transition={{
          scale: { type: "spring", stiffness: 320, damping: 14, delay: 0.12 },
          opacity: { duration: 0.2, delay: 0.12 },
          rotate: { type: "spring", stiffness: 400, damping: 20 },
        }}
      >
        <IconPlus size={26} strokeWidth={2.5} />
      </motion.button>
    </>
  );
}
