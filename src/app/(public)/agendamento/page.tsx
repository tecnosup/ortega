"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  telefone: z.string().min(8, "Telefone obrigatório"),
  servico: z.string().min(1, "Escolha um serviço"),
  data: z.string().min(1, "Escolha uma data"),
  horario: z.string().min(1, "Escolha um horário"),
});

type FormData = z.infer<typeof schema>;

const SERVICOS = [
  "Corte Clássico",
  "Barba Completa",
  "Combo Corte + Barba",
  "Coloração e Luzes",
  "Sobrancelha",
];

const HORARIOS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
];

export default function AgendamentoPage() {
  const [sent, setSent] = useState(false);
  const [sentData, setSentData] = useState<FormData | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setSentData(data);
    setSent(true);
  }

  return (
    <section className="min-h-screen pt-28 pb-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-[#b8944a] text-sm font-medium tracking-widest uppercase">Reservas</span>
          <h1 className="text-3xl font-bold text-[#1a1a1a] mt-2">Agende seu horário</h1>
          <p className="text-gray-500 mt-3 max-w-md mx-auto">
            Escolha o serviço, data e horário. Confirmaremos pelo WhatsApp em instantes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            {sent && sentData ? (
              <div className="bg-[#1a1a1a] p-8 flex flex-col gap-4">
                <div className="w-12 h-12 bg-[#b8944a] flex items-center justify-center text-white text-xl font-bold">✓</div>
                <h2 className="text-xl font-bold text-white">Agendamento recebido!</h2>
                <p className="text-gray-400 text-sm">
                  Olá, <strong className="text-white">{sentData.nome}</strong>! Seu agendamento para{" "}
                  <strong className="text-[#b8944a]">{sentData.servico}</strong> em{" "}
                  <strong className="text-white">{sentData.data}</strong> às{" "}
                  <strong className="text-white">{sentData.horario}</strong> foi recebido.
                  <br /><br />
                  Entraremos em contato pelo número <strong className="text-white">{sentData.telefone}</strong> para confirmar.
                </p>
                <a
                  href={`https://wa.me/5511999999999?text=Olá! Quero confirmar meu agendamento: ${sentData.servico} em ${sentData.data} às ${sentData.horario}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-start mt-2 inline-flex items-center px-5 py-2.5 bg-[#b8944a] text-white text-sm font-medium hover:bg-[#a07d3a] transition"
                >
                  Confirmar pelo WhatsApp
                </a>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                <Input
                  label="Nome completo"
                  placeholder="Seu nome"
                  {...register("nome")}
                  error={errors.nome?.message}
                />
                <Input
                  label="Telefone / WhatsApp"
                  placeholder="(11) 99999-9999"
                  {...register("telefone")}
                  error={errors.telefone?.message}
                />

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Serviço</label>
                  <select
                    {...register("servico")}
                    className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#b8944a]"
                  >
                    <option value="">Selecione um serviço</option>
                    {SERVICOS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.servico && <p className="text-xs text-red-500">{errors.servico.message}</p>}
                </div>

                <Input
                  label="Data desejada"
                  type="date"
                  {...register("data")}
                  error={errors.data?.message}
                />

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Horário</label>
                  <select
                    {...register("horario")}
                    className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#b8944a]"
                  >
                    <option value="">Selecione um horário</option>
                    {HORARIOS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  {errors.horario && <p className="text-xs text-red-500">{errors.horario.message}</p>}
                </div>

                <Button type="submit" disabled={isSubmitting} size="lg">
                  {isSubmitting ? "Enviando..." : "Confirmar agendamento"}
                </Button>
              </form>
            )}
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-gray-50 border border-gray-200 p-6 flex flex-col gap-4">
              <h3 className="font-semibold text-[#1a1a1a]">Onde estamos</h3>
              <p className="text-sm text-gray-500">
                Rua Exemplo, 123 — Bairro Centro<br />
                São Paulo, SP — CEP 01310-100
              </p>
              <div className="w-full h-48 bg-gray-200 overflow-hidden">
                {/* Substituir pelo embed real do Google Maps após o cliente fornecer o endereço */}
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1!2d-46.6333!3d-23.5505!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDMzJzAxLjgiUyA0NsKwMzgnMDAuMCJX!5e0!3m2!1spt-BR!2sbr!4v1234567890"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Localização Ortega Barber"
                />
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-6 flex flex-col gap-3">
              <h3 className="font-semibold text-[#1a1a1a]">Horário de funcionamento</h3>
              <div className="text-sm text-gray-500 flex flex-col gap-1">
                <div className="flex justify-between">
                  <span>Segunda a Sexta</span>
                  <span className="font-medium text-[#1a1a1a]">09:00 – 19:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Sábado</span>
                  <span className="font-medium text-[#1a1a1a]">09:00 – 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Domingo</span>
                  <span className="font-medium text-gray-400">Fechado</span>
                </div>
              </div>
            </div>

            <a
              href="https://wa.me/5511999999999?text=Olá! Gostaria de agendar um horário na Ortega Barber."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1a1a1a] text-white text-sm font-medium hover:bg-[#2d2d2d] transition"
            >
              Prefere o WhatsApp? Fale agora
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
