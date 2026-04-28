import type { LandingSettings } from "./admin-settings";
import type { Item } from "./admin-items";

export const demoSettings: LandingSettings = {
  heroTitulo: "Você mais bonito",
  heroSubtitulo: "Cortes precisos, barba impecável e atendimento exclusivo. Na Ortega, cada detalhe importa.",
  sobreTexto:
    "A Ortega Barber nasceu da paixão pelo artesanato da barbearia tradicional aliado ao estilo contemporâneo. Em nosso espaço, você encontra profissionais dedicados, ambiente premium e os melhores produtos do mercado. Mais do que um corte, oferecemos uma experiência completa de cuidado masculino.",
  whatsappNumber: "5511999999999",
  emailContato: "contato@ortegabarber.com.br",
};

export const demoServicos: Item[] = [
  {
    id: "1",
    titulo: "Corte Clássico",
    descricao: "Corte masculino tradicional com acabamento impecável. Inclui lavagem e finalização.",
    imagem: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80",
    status: "published",
    order: 1,
    preco: "55",
    duracao: "45 min",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "2",
    titulo: "Barba Completa",
    descricao: "Modelagem e aparagem de barba com navalha, toalha quente e hidratação profissional.",
    imagem: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&q=80",
    status: "published",
    order: 2,
    preco: "45",
    duracao: "35 min",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "3",
    titulo: "Combo Corte + Barba",
    descricao: "O pacote completo: corte, barba e hidratação capilar. Saída garantida de estilo.",
    imagem: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&q=80",
    status: "published",
    order: 3,
    preco: "90",
    duracao: "75 min",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "4",
    titulo: "Coloração e Luzes",
    descricao: "Coloração profissional, luzes ou descoloração com produtos de alta qualidade.",
    imagem: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80",
    status: "published",
    order: 4,
    preco: "A partir de R$ 120",
    duracao: "90 min",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "5",
    titulo: "Sobrancelha",
    descricao: "Design e aparagem de sobrancelha com linha e navalha para um resultado natural.",
    imagem: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=600&q=80",
    status: "published",
    order: 5,
    preco: "25",
    duracao: "20 min",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];
