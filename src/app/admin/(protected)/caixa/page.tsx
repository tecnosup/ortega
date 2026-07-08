"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import type { FechamentoDia } from "@/lib/agendamentos-types";
import type { Comanda } from "@/lib/comandas-types";
import type { GastoDia } from "@/lib/gastos-dia-tipos";
import CaixaCalendario from "@/components/admin/CaixaCalendario";
import AdminFab from "@/components/admin/AdminFab";

export default function CaixaPage() {
  const [fechamentos, setFechamentos] = useState<FechamentoDia[]>([]);
  const [gastosDia, setGastosDia] = useState<GastoDia[]>([]);
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    const [resFech, resGastosDia, resComandas] = await Promise.all([
      fetch("/api/fechamento", { credentials: "include" }),
      fetch("/api/gastos-dia", { credentials: "include" }),
      fetch("/api/comandas", { credentials: "include" }),
    ]);
    if (resFech.ok) setFechamentos(await resFech.json());
    if (resGastosDia.ok) setGastosDia(await resGastosDia.json());
    if (resComandas.ok) setComandas(await resComandas.json());
    setCarregando(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  if (carregando) return <div className="flex items-center justify-center h-64 text-gray-500 text-sm">Carregando...</div>;

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-5">
      <AdminFab />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#F5E6C8]">Caixa</h1>
        <p className="text-xs text-gray-500 hidden sm:block">Comandas, fechamentos e gastos por dia</p>
      </div>

      <div id="caixa">
        <CaixaCalendario fechamentos={fechamentos} gastosDia={gastosDia} comandas={comandas} onAtualizar={carregar} />
      </div>
    </div>
  );
}
