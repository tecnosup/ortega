"use client";
import { deleteItemAction } from "./actions";
import {
  IconTrash,
} from "@tabler/icons-react";

export default function DeleteButton({ id }: { id: string }) {
  return (
    <form action={deleteItemAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        onClick={(e) => { if (!confirm("Remover este serviço?")) e.preventDefault(); }}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2d2d2d] text-gray-500 text-xs rounded hover:border-red-700 hover:text-red-400 transition"
      >
        <IconTrash size={12} /> Excluir
      </button>
    </form>
  );
}
