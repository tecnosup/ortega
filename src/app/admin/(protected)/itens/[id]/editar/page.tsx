import { getItemById } from "@/lib/admin-items";
import { notFound } from "next/navigation";
import ItemForm from "@/components/admin/ItemForm";
import { updateItemAction } from "../../actions";

export default async function EditarItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getItemById(id);
  if (!item) notFound();

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Editar serviço</h1>
      <ItemForm action={updateItemAction} item={item} />
    </div>
  );
}
