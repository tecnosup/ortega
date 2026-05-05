"use client";

import { deleteDescontoAction } from "./actions";

export default function DeleteDescontoButton({ id }: { id: string }) {
  return (
    <form action={deleteDescontoAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        onClick={(e) => { if (!confirm("Excluir desconto?")) e.preventDefault(); }}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] text-red-400 text-xs rounded hover:border-red-400 transition"
      >
        Excluir
      </button>
    </form>
  );
}
