"use client";

import { useTransition } from "react";
import { IconLoader2, IconTrash } from "@tabler/icons-react";
import { deleteDescontoAction } from "./actions";
import { useConfirm } from "@/components/ui/Confirm";

export default function DeleteDescontoButton({ id }: { id: string }) {
  const confirmar = useConfirm();
  const [pending, startTransition] = useTransition();

  async function handleClick() {
    if (!(await confirmar({ titulo: "Excluir desconto", mensagem: "Excluir este desconto? Esta ação é irreversível.", confirmar: "Excluir" }))) return;
    const fd = new FormData();
    fd.append("id", id);
    // a action faz redirect() → a lista recarrega sozinha (é o feedback);
    // não dá pra mostrar popup depois porque o redirect troca a página.
    startTransition(() => { deleteDescontoAction(fd); });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] text-red-400 text-xs rounded hover:border-red-400 transition disabled:opacity-50"
    >
      {pending ? <IconLoader2 size={12} className="animate-spin" /> : <IconTrash size={12} />} Excluir
    </button>
  );
}
