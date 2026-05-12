"use server";

import { revalidatePath } from "next/cache";
import { createCategoria, updateCategoria, deleteCategoria } from "@/lib/admin-categorias";

export async function createCategoriaAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const nome = (formData.get("nome") as string)?.trim();
  if (!nome) return { ok: false, error: "Nome obrigatório" };
  try {
    await createCategoria(nome);
    revalidatePath("/admin/categorias");
    revalidatePath("/admin/produtos");
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao criar categoria" };
  }
}

export async function updateCategoriaAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const id = formData.get("id") as string;
  const nome = (formData.get("nome") as string)?.trim();
  if (!id || !nome) return { ok: false, error: "Dados inválidos" };
  try {
    await updateCategoria(id, nome);
    revalidatePath("/admin/categorias");
    revalidatePath("/admin/produtos");
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao atualizar categoria" };
  }
}

export async function deleteCategoriaAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const id = formData.get("id") as string;
  if (!id) return { ok: false, error: "ID inválido" };
  try {
    await deleteCategoria(id);
    revalidatePath("/admin/categorias");
    revalidatePath("/admin/produtos");
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao deletar categoria" };
  }
}
