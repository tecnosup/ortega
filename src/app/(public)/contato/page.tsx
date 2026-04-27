"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { useState } from "react";

const schema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().min(8, "Telefone obrigatório"),
  mensagem: z.string().min(10, "Mensagem muito curta"),
});

type FormData = z.infer<typeof schema>;

export default function ContatoPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    await fetch("/api/contato", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    // TODO: plugar fluxo de conversão — WhatsApp, gateway, agendamento, e-mail, etc.
    setSent(true);
  }

  return (
    <section className="min-h-screen pt-28 pb-24 bg-white">
      <div className="max-w-xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contato</h1>
        <p className="text-gray-500 mb-10">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </p>

        {sent ? (
          <p className="text-gray-900 font-medium">Mensagem enviada! Em breve entraremos em contato.</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Input label="Nome" placeholder="Seu nome" {...register("nome")} error={errors.nome?.message} />
            <Input label="E-mail" type="email" placeholder="seu@email.com" {...register("email")} error={errors.email?.message} />
            <Input label="Telefone" placeholder="(11) 99999-9999" {...register("telefone")} error={errors.telefone?.message} />
            <Textarea label="Mensagem" placeholder="Como podemos ajudar?" {...register("mensagem")} error={errors.mensagem?.message} />
            <Button type="submit" disabled={isSubmitting} size="lg">
              {isSubmitting ? "Enviando..." : "Enviar mensagem"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
