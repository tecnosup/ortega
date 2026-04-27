import { Box } from "lucide-react";
import type { Item } from "@/lib/admin-items";

interface ServicosProps {
  items: Item[];
}

const PLACEHOLDER_ITEMS = [
  { id: "1", titulo: "Serviço 1", descricao: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam." },
  { id: "2", titulo: "Serviço 2", descricao: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam." },
  { id: "3", titulo: "Serviço 3", descricao: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam." },
];

export default function Servicos({ items }: ServicosProps) {
  const lista = items.length > 0 ? items : PLACEHOLDER_ITEMS;

  return (
    <section id="servicos" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">O que oferecemos</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {lista.map((item) => (
            <div key={item.id} className="border border-gray-200 p-6 flex flex-col gap-4">
              <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-gray-400">
                {/* insira ícone aqui */}
                <Box size={20} />
              </div>
              <h3 className="font-semibold text-gray-900">{item.titulo}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.descricao}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
