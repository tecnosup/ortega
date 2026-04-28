import ItemForm from "@/components/admin/ItemForm";
import { createItemAction } from "../actions";

export default function NovoItemPage() {
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Novo serviço</h1>
      <ItemForm action={createItemAction} />
    </div>
  );
}
